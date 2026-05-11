import { guardianSystemPrompt, parseGuardianJson } from "../../risk/explanationPrompt";
import type { GuardianExplanation, RiskAssessment, RiskFinding } from "../../solana/types";
import type { QvacClient, ScamPatternMatch } from "../types";
import {
  sanitizeWalletExplanation,
  sanitizeScreenshotExplanation,
  sanitizeTransactionExplanation
} from "./sanitize";

// Serialize LLM calls so concurrent requests don't overwhelm the QVAC runtime.
let llmQueue: Promise<unknown> = Promise.resolve();

function enqueueLlm<T>(fn: () => Promise<T>): Promise<T> {
  const next = llmQueue.then(fn, fn);
  llmQueue = next.then(
    () => undefined,
    () => undefined
  );
  return next;
}

export async function generateGuardianExplanation(
  qvac: QvacClient,
  userPrompt: string,
  assessment: RiskAssessment,
  mode: "transaction" | "wallet" | "screenshot" = "transaction",
  screenshotContext?: { findings: RiskFinding[]; matches: ScamPatternMatch[] },
  intentText?: string,
  context: "pre-sign" | "sender" | "recipient" | "viewer" = "pre-sign"
): Promise<GuardianExplanation> {
  const raw = await enqueueLlm(() =>
    qvac.llm.generate({
      systemPrompt: guardianSystemPrompt,
      userPrompt,
      temperature: 0.2,
      maxTokens: 1000
    })
  );

  const explanation = parseGuardianJson(raw, assessment.level);

  // The deterministic score always wins — LLM cannot change the risk level.
  explanation.riskLevel = assessment.level;

  // Drop a summary that is literally just a risk-level word (LLM sometimes does this).
  const RISK_WORDS = new Set(["low", "medium", "high", "critical"]);
  if (RISK_WORDS.has((explanation.summary ?? "").trim().toLowerCase())) {
    explanation.summary = "";
  }

  if (mode === "wallet") {
    return sanitizeWalletExplanation(explanation, assessment);
  }

  if (mode === "screenshot" && screenshotContext) {
    return sanitizeScreenshotExplanation(explanation, assessment, screenshotContext);
  }

  return sanitizeTransactionExplanation(explanation, assessment, intentText, context);
}
