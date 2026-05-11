import { NextResponse } from "next/server";
import { buildTransactionPrompt } from "@/lib/risk/explanationPrompt";
import { checkIntent } from "@/lib/risk/intentCheck";
import { evaluateGuardianPolicy, normalizeGuardianPolicy, type GuardianPolicy } from "@/lib/risk/policy";
import { scoreFindings } from "@/lib/risk/scoreRisk";
import { generateGuardianExplanation } from "@/lib/qvac/llm";
import { getQvacClient } from "@/lib/qvac/qvacClient";
import { searchGlossary } from "@/lib/qvac/knowledgeRag";
import {
  fetchTransactionBySignature,
  parseTransactionInput,
  isParsedTransactionFacts,
  simulateBase64Transaction
} from "@/lib/solana/parseTransaction";
import { evaluateTransactionRisk } from "@/lib/solana/riskRules";
import type { ParsedTransactionFacts, ViewerContext } from "@/lib/solana/types";

export const runtime = "nodejs";

// The Guardian browser extension's background service worker sends requests
// with Origin: chrome-extension://<id>. The Next.js headers() config only
// covers regular responses — it does NOT respond to OPTIONS preflight requests.
// This explicit OPTIONS handler is required for the extension to work.
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

const SOLANA_SIGNATURE_RE = /^[1-9A-HJ-NP-Za-km-z]{87,88}$/;
const VALID_CONTEXTS = ["pre-sign", "sender", "recipient", "viewer"] as const;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      signature?: string;
      base64Transaction?: string;
      parsedFacts?: ParsedTransactionFacts;
      context?: ViewerContext;
      userIntent?: string;
      policy?: Partial<GuardianPolicy>;
    };
    const context: ViewerContext =
      body.context && (VALID_CONTEXTS as readonly string[]).includes(body.context)
        ? body.context
        : "pre-sign";
    const isSignature = (s: string) => SOLANA_SIGNATURE_RE.test(s.trim());
    const explicitSignature = body.signature;
    const inferredSignature =
      !explicitSignature && body.base64Transaction && isSignature(body.base64Transaction)
        ? body.base64Transaction
        : undefined;
    let facts: ParsedTransactionFacts;
    if (explicitSignature ?? inferredSignature) {
      try {
        facts = await fetchTransactionBySignature((explicitSignature ?? inferredSignature)!);
      } catch (rpcError) {
        const message = rpcError instanceof Error ? rpcError.message : "";
        const isRateLimit = message.includes("429") || message.includes("Too Many Requests");
        const isNetworkError =
          message.includes("ECONNREFUSED") ||
          message.includes("ENOTFOUND") ||
          message.includes("fetch") ||
          message.includes("network") ||
          message.includes("timeout");
        if (isRateLimit) {
          return NextResponse.json(
            { error: "The public Solana RPC is rate-limiting requests. Wait a few seconds and try again." },
            { status: 429 }
          );
        }
        if (isNetworkError) {
          return NextResponse.json(
            { error: "Solana RPC is unreachable. Check your internet connection and try again." },
            { status: 503 }
          );
        }
        return NextResponse.json(
          { error: "Transaction not found on-chain. Check the signature and try again." },
          { status: 404 }
        );
      }
    } else {
      try {
        if (body.parsedFacts !== undefined && !isParsedTransactionFacts(body.parsedFacts)) {
          return NextResponse.json({ error: "Invalid transaction data." }, { status: 400 });
        }
        facts = parseTransactionInput(body.parsedFacts ?? body.base64Transaction ?? "");
      } catch {
        return NextResponse.json({ error: "Invalid transaction data." }, { status: 400 });
      }
    }
    const userIntent =
      typeof body.userIntent === "string" && body.userIntent.trim()
        ? body.userIntent.trim().slice(0, 500)
        : undefined;
    const simulationResult =
      body.base64Transaction && !explicitSignature && !inferredSignature
        ? await simulateBase64Transaction(body.base64Transaction, facts)
        : undefined;
    const baseFindings = evaluateTransactionRisk(facts, context);
    const policy = normalizeGuardianPolicy(body.policy);
    baseFindings.push(...evaluateGuardianPolicy(facts, policy));
    const intentCheck = userIntent ? checkIntent(userIntent, facts) : undefined;

    if (intentCheck?.verdict === "critical_mismatch") {
      baseFindings.push({
        id: "intent-critical-mismatch",
        title: "Stated intent does not match transaction",
        severity: "critical",
        scoreImpact: 30,
        explanation: intentCheck.reason,
        evidence: [`Declared: "${intentCheck.declaredIntent}"`, `Actual: ${intentCheck.actualEffect}`]
      });
    } else if (intentCheck?.verdict === "partial_mismatch") {
      baseFindings.push({
        id: "intent-partial-mismatch",
        title: "Transaction does more than stated intent suggests",
        severity: "high",
        scoreImpact: 15,
        explanation: intentCheck.reason,
        evidence: [`Declared: "${intentCheck.declaredIntent}"`, `Actual: ${intentCheck.actualEffect}`]
      });
    }

    // Intent-simulation mismatch: simulation confirms on-chain what the rule engine suspected.
    // Only fires when simulation is available, intent was declared, and the on-chain
    // result contradicts a "safe" intent (claim / connect / verify / airdrop / mint).
    const safeIntentPattern =
      /\b(claim|connect|verify|airdrop|mint|login|validate|collect|register|activate)\b/i;
    const hasOnChainRisk =
      facts.approvals.length > 0 ||
      facts.authorityChanges.length > 0 ||
      facts.transfers.some((t) => t.from && facts.signerAddresses.includes(t.from));
    if (
      simulationResult?.wouldSucceed &&
      userIntent &&
      safeIntentPattern.test(userIntent) &&
      hasOnChainRisk &&
      !baseFindings.some((f) => f.id === "intent-critical-mismatch")
    ) {
      baseFindings.push({
        id: "intent-simulation-mismatch",
        title: "Simulated result does not match stated intent",
        severity: "critical",
        scoreImpact: 30,
        explanation:
          "The transaction would succeed on-chain and the simulation confirms it moves assets or changes permissions - " +
          "which does not match the safe intent you declared (e.g. claim, connect, verify). " +
          "This is the on-chain confirmation of what the risk rules already detected.",
        evidence: [
          `Declared intent: "${userIntent}"`,
          ...(facts.approvals.length > 0 ? [`Simulation confirms: delegate approval on-chain`] : []),
          ...(facts.authorityChanges.length > 0 ? [`Simulation confirms: authority change on-chain`] : []),
          ...(facts.transfers.length > 0 ? [`Simulation confirms: asset transfer on-chain`] : [])
        ]
      });
    }

    const assessment = scoreFindings(baseFindings);
    const qvac = getQvacClient();

    const glossaryQuery = [
      ...facts.programs.map((p) => p.label ?? p.programId),
      ...(facts.approvals.length > 0 ? ["delegate approval token"] : []),
      ...(facts.authorityChanges.length > 0 ? ["SetAuthority authority change"] : []),
      ...assessment.findings.map((f) => f.title)
    ].join(", ");
    const glossaryEntries = await searchGlossary(qvac, glossaryQuery).catch(() => []);

    let explanation: Awaited<ReturnType<typeof generateGuardianExplanation>> | null = null;
    let llmError: string | undefined;
    try {
      explanation = await generateGuardianExplanation(
        qvac,
        buildTransactionPrompt(facts, assessment, context, intentCheck, glossaryEntries),
        assessment,
        "transaction",
        undefined,
        intentCheck?.declaredIntent,
        context
      );
    } catch (llmErr) {
      llmError = llmErr instanceof Error ? llmErr.message : "LLM unavailable — retry in a moment.";
    }

    return NextResponse.json(
      {
        mode: qvac.mode,
        context,
        policy,
        intentCheck,
        facts,
        assessment,
        explanation,
        llmError,
        simulationResult
      },
      { headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error("[analyze-transaction]", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: "Unable to analyze transaction." },
      { status: 400, headers: CORS_HEADERS }
    );
  }
}
