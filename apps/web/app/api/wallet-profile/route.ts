import { NextResponse } from "next/server";
import { buildWalletPrompt } from "@/lib/risk/explanationPrompt";
import { scoreFindings } from "@/lib/risk/scoreRisk";
import { generateGuardianExplanation } from "@/lib/qvac/llm";
import { getQvacClient } from "@/lib/qvac/qvacClient";
import { searchSafetyRules } from "@/lib/qvac/knowledgeRag";
import { fetchWalletProfile, isValidSolanaAddress, WalletProfileError } from "@/lib/solana/walletProfile";
import { evaluateWalletRisk } from "@/lib/solana/walletRisk";

export const runtime = "nodejs";

const NEVER_FUNDED_EXPLANATION = {
  summary: "This address has no on-chain history on Solana mainnet.",
  plainEnglishExplanation:
    "Guardian found no account record for this address. It has never been funded or used. " +
    "If you intended to send funds here, double-check the address \u2014 there is no on-chain evidence it belongs to a real wallet.",
  reasons: ["No on-chain account record found"],
  suggestedAction: "Verify this address before sending any funds to it.",
  confidence: "High" as const
} as const;

export async function POST(request: Request) {
  const body = (await request.json()) as { address?: string };
  const address = body.address?.trim();

  if (!address) {
    return NextResponse.json({ error: "address is required." }, { status: 400 });
  }
  if (!isValidSolanaAddress(address)) {
    return NextResponse.json({ error: "Invalid Solana address." }, { status: 400 });
  }

  let facts;
  try {
    facts = await fetchWalletProfile(address);
  } catch (err) {
    if (err instanceof WalletProfileError) {
      const status = err.code === "rpc-error" ? 503 : 400;
      console.error("[wallet-profile]", err.message);
      return NextResponse.json({ error: "Unable to load wallet data." }, { status });
    }
    const message = err instanceof Error ? err.message : "";
    if (message.includes("429") || message.includes("Too Many Requests")) {
      return NextResponse.json(
        { error: "The public Solana RPC is rate-limiting requests. Wait a few seconds and try again." },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: "Could not fetch wallet data. Check your connection and try again." },
      { status: 503 }
    );
  }

  const findings = evaluateWalletRisk(facts);
  const assessment = scoreFindings(findings);
  const qvac = getQvacClient();

  if (facts.neverFunded === true) {
    const explanation = { ...NEVER_FUNDED_EXPLANATION, riskLevel: assessment.level };
    return NextResponse.json({ mode: qvac.mode, facts, assessment, explanation });
  }

  const safetyQuery = [
    ...findings.map((f) => f.title + " " + (f.evidence?.[0] ?? "")),
    facts.tokenAccounts.some((t) => t.delegate) ? "token delegate approval risk" : ""
  ]
    .filter(Boolean)
    .join(". ");
  // topK=2: keep the prompt short enough for the on-device LLM to complete
  // the JSON response without running out of tokens.
  const safetyRules = await searchSafetyRules(qvac, safetyQuery, 2).catch(() => []);

  let explanation: Awaited<ReturnType<typeof generateGuardianExplanation>> | null = null;
  let llmError: string | undefined;
  try {
    explanation = await generateGuardianExplanation(
      qvac,
      buildWalletPrompt(facts, assessment, safetyRules),
      assessment,
      "wallet"
    );
  } catch (llmErr) {
    llmError = llmErr instanceof Error ? llmErr.message : "LLM unavailable — retry in a moment.";
  }

  return NextResponse.json({ mode: qvac.mode, facts, assessment, explanation, llmError });
}
