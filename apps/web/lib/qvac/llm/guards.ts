/**
 * FACT_INVERSION_GUARDS — post-processing safety net for the LLM.
 *
 * Each guard maps a set of deterministic finding IDs to a negation pattern.
 * When a finding is confirmed by the deterministic engine but the LLM's
 * plain-English explanation denies it, the explanation is replaced with
 * the deterministic finding's own text.
 */
import type { RiskFinding } from "../../solana/types";

export type FactInversionGuard = {
  /** If any of these finding IDs are in the assessment, the guard is active. */
  findingIds: string[];
  /** Regex that detects the LLM negating a confirmed fact. */
  negationPattern: RegExp;
  /** Produces the replacement text from the active findings. */
  replacement: (findings: RiskFinding[]) => string;
};

export const FACT_INVERSION_GUARDS: FactInversionGuard[] = [
  {
    findingIds: ["token-approval", "policy-block-delegate-approval"],
    negationPattern:
      /\b(without|no|not|never|doesn'?t|didn'?t|does not|did not)\b.{0,50}\b(approv|delegate)\b/i,
    replacement: (f) =>
      f
        .filter((x) => ["token-approval", "policy-block-delegate-approval"].includes(x.id))
        .map((x) => x.explanation)
        .join(" ")
  },
  {
    findingIds: ["authority-change", "pumpfun-authority-change", "policy-authority-change-review"],
    negationPattern:
      /\b(without|no|not|never|doesn'?t|didn'?t|does not|did not)\b.{0,50}\b(authority|change)\b/i,
    replacement: (f) =>
      f
        .filter((x) =>
          ["authority-change", "pumpfun-authority-change", "policy-authority-change-review"].includes(x.id)
        )
        .map((x) => x.explanation)
        .join(" ")
  },
  {
    findingIds: ["unknown-program", "policy-block-unknown-program"],
    negationPattern: /\b(without|no|not|never|all).{0,30}\b(unknown|unrecognized|known registry)\b/i,
    replacement: (f) =>
      f
        .filter((x) => ["unknown-program", "policy-block-unknown-program"].includes(x.id))
        .map((x) => x.explanation)
        .join(" ")
  }
];
