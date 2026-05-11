import type { GuardianExplanation, RiskAssessment, RiskFinding } from "../../solana/types";
import type { ScamPatternMatch } from "../types";
import { FACT_INVERSION_GUARDS } from "./guards";

export function sanitizeWalletExplanation(
  explanation: GuardianExplanation,
  assessment: RiskAssessment
): GuardianExplanation {
  const findings = assessment.findings;

  // Replace degenerate summary
  if (!explanation.summary || explanation.summary.trim().split(/\s+/).length < 4) {
    const serious = findings.filter((f) => f.severity !== "low");
    const low = findings.filter((f) => f.severity === "low");
    if (findings.length === 0) {
      explanation.summary = "No risk signals detected. This wallet appears clean.";
    } else if (serious.length === 0) {
      explanation.summary =
        low.length === 1
          ? `No serious risk signals. One activity note: ${low[0].title}.`
          : `No serious risk signals. ${low.length} low-severity activity notes found.`;
    } else {
      explanation.summary = `This wallet has ${serious.length} warning sign${serious.length > 1 ? "s" : ""}: ${serious.map((f) => f.title).join("; ")}.`;
    }
  }

  // Ensure every finding appears in reasons
  const missing = findings.filter(
    (f) =>
      !explanation.reasons?.some((r: string) => r.toLowerCase().includes(f.title.toLowerCase().slice(0, 12)))
  );
  if (missing.length > 0) {
    explanation.reasons = [
      ...(explanation.reasons ?? []),
      ...missing.map((f) => `${f.title}: ${f.evidence?.[0] ?? f.explanation}`)
    ];
  }

  // Anchor suggestedAction to deterministic score
  if (assessment.score === 0) {
    explanation.confidence = "High";
    explanation.suggestedAction = "No risk signals found. This wallet appears clean.";
  } else if (assessment.score < 25) {
    explanation.confidence = "High";
    explanation.suggestedAction = "Low risk profile. Review any flagged items before interacting.";
  } else if (assessment.level === "Critical") {
    explanation.confidence = "High";
    explanation.suggestedAction = "Critical risk. Do not send funds to or interact with this wallet.";
  } else if (assessment.level === "High") {
    explanation.confidence = "High";
    explanation.suggestedAction = "High risk. Treat interactions with this wallet with extreme caution.";
  }

  return explanation;
}

export function sanitizeScreenshotExplanation(
  explanation: GuardianExplanation,
  assessment: RiskAssessment,
  screenshotContext: { findings: RiskFinding[]; matches: ScamPatternMatch[] }
): GuardianExplanation {
  const { findings, matches } = screenshotContext;
  const allSignalTitles = [...findings.map((f) => f.title), ...matches.map((m) => m.title)];
  const hasRagMatches = matches.length > 0;

  // Replace degenerate summary
  if (!explanation.summary || explanation.summary.trim().split(/\s+/).length < 4) {
    explanation.summary =
      allSignalTitles.length > 0
        ? `This message contains scam signals: ${allSignalTitles.join("; ")}.`
        : "No scam signals detected. This message appears legitimate.";
  }

  // Ensure scamSignals covers all detected signals
  const existing: string[] = explanation.scamSignals ?? [];
  const missingSignals = allSignalTitles.filter(
    (t) => !existing.some((s: string) => s.toLowerCase().includes(t.toLowerCase().slice(0, 12)))
  );
  if (missingSignals.length > 0) {
    explanation.scamSignals = [...existing, ...missingSignals];
  }

  // Anchor suggestedAction
  explanation.confidence = "High";
  if (assessment.score === 0 && !hasRagMatches) {
    explanation.suggestedAction = "No scam signals found. This message appears safe.";
  } else if (assessment.score === 0 && hasRagMatches) {
    explanation.suggestedAction =
      "Potential scam pattern detected. Do not comply. Treat this message with extreme caution.";
  } else if (assessment.score < 25) {
    const hasRealSignal = findings.some((f) => f.severity !== "low") || hasRagMatches;
    explanation.suggestedAction = hasRealSignal
      ? "Minor signals noted. Review carefully before taking any action."
      : "No significant scam signals found. This message appears safe.";
  } else if (assessment.level === "Critical" || assessment.level === "High") {
    explanation.suggestedAction = "Do not comply. This appears to be a scam. Ignore and report it.";
  }

  return explanation;
}

const BOILERPLATE_FRAGMENTS = [
  "the user is about to sign this transaction and needs to decide",
  "the user is about to sign"
];
const CONTRADICTION_FRAGMENTS = [
  "required step to claim",
  "necessary step to claim",
  "required to claim",
  "needed to claim",
  "part of claiming",
  "common step",
  "normal step",
  "standard step"
];

export function sanitizeTransactionExplanation(
  explanation: GuardianExplanation,
  assessment: RiskAssessment,
  intentText?: string,
  context: "pre-sign" | "sender" | "recipient" | "viewer" = "pre-sign"
): GuardianExplanation {
  // Anchor confidence and suggestedAction
  explanation.confidence = "High";
  if (context === "pre-sign") {
    if (assessment.level === "Critical" || assessment.level === "High") {
      explanation.suggestedAction = "Do not sign. This transaction shows serious risk signals.";
    } else if (assessment.level === "Medium") {
      explanation.suggestedAction = "Sign with caution. Review the risk findings below before proceeding.";
    } else {
      const hasMediumPlus = assessment.findings.some(
        (f) => f.severity === "medium" || f.severity === "high" || f.severity === "critical"
      );
      explanation.suggestedAction = hasMediumPlus
        ? "Sign with caution. Review the risk findings below before proceeding."
        : "Safe to sign. No serious risk signals were detected.";
    }
  } else {
    // For sender/recipient/viewer: always override for High/Critical risk so the LLM
    // cannot hallucinate a benign note. Only leave the LLM value for Low/Medium.
    const CONTEXT_HIGH_RISK_NOTE: Record<string, string> = {
      sender: "This was a high-risk transaction. Review the findings below.",
      recipient:
        "This transaction carries high-risk signals. Be cautious before interacting with the sender.",
      viewer: "This transaction has serious risk signals. Do not interact with it."
    };
    const CONTEXT_MEDIUM_RISK_NOTE: Record<string, string> = {
      sender: "This transaction had some risk signals. Review the findings below.",
      recipient: "This transaction has some risk signals. Review before interacting with the sender.",
      viewer: "This transaction has some risk signals worth reviewing."
    };
    if (assessment.level === "Critical" || assessment.level === "High") {
      explanation.suggestedAction =
        CONTEXT_HIGH_RISK_NOTE[context] ?? "This transaction has serious risk signals.";
    } else if (assessment.level === "Medium") {
      explanation.suggestedAction =
        CONTEXT_MEDIUM_RISK_NOTE[context] ?? "This transaction has some risk signals worth reviewing.";
    }
    // Low risk: keep LLM-generated note as-is (it's allowed to say "looks fine")
  }

  // Fact-inversion guard
  const activeIds = new Set(assessment.findings.map((f) => f.id));
  for (const guard of FACT_INVERSION_GUARDS) {
    const hasMatchingFinding = guard.findingIds.some((id) => activeIds.has(id));
    if (hasMatchingFinding && guard.negationPattern.test(explanation.plainEnglishExplanation ?? "")) {
      const replacement = guard.replacement(assessment.findings);
      if (replacement) explanation.plainEnglishExplanation = replacement;
    }
  }

  // Sanitize reasons
  const findingExplanations = assessment.findings
    .filter((f) => f.severity !== "low")
    .map((f) => f.explanation);
  const reasonsAreBad =
    !explanation.reasons?.length ||
    explanation.reasons.every(
      (r: string) => assessment.findings.some((f) => f.id === r || f.title === r) || r.length < 20
    );
  if (reasonsAreBad && findingExplanations.length > 0) {
    explanation.reasons = findingExplanations;
  }

  // Sanitize plainEnglishExplanation when clearly broken
  const explanationText = explanation.plainEnglishExplanation ?? "";
  const explanationLower = explanationText.toLowerCase();
  const isTooShort = explanationText.trim().split(/\s+/).length < 8;
  const isBoilerplate = BOILERPLATE_FRAGMENTS.some((f) => explanationLower.startsWith(f));
  const isContradictingHighRisk =
    (assessment.level === "Critical" || assessment.level === "High") &&
    CONTRADICTION_FRAGMENTS.some((f) => explanationLower.includes(f));
  if (isTooShort || isBoilerplate || isContradictingHighRisk) {
    const highFindings = assessment.findings.filter((f) => f.severity !== "low");
    explanation.plainEnglishExplanation =
      highFindings.length > 0
        ? highFindings.map((f) => f.explanation).join(" ")
        : "This transaction uses known programs only and no risk signals were detected.";
  }

  // Sanitize summary
  const summaryText = explanation.summary ?? "";
  const intentLower = (intentText ?? "").toLowerCase().trim().slice(0, 60);
  const summaryMirrorsIntent =
    intentLower.length > 8 &&
    (explanation.summary ?? "")
      .toLowerCase()
      .includes(intentLower.slice(0, Math.min(intentLower.length, 30)));
  const summaryIsBad =
    summaryText.trim().split(/\s+/).length < 5 ||
    /[1-9A-HJ-NP-Za-km-z]{32,44}/.test(summaryText) ||
    summaryMirrorsIntent;
  if (summaryIsBad) {
    const highFindings = assessment.findings.filter((f) => f.severity !== "low");
    explanation.summary =
      highFindings.length > 0
        ? highFindings[0].explanation
        : "This transaction calls known Solana programs with no detected risk signals.";
  }

  // Low-only findings alarm guard
  const onlyLowFindings =
    assessment.findings.length > 0 && assessment.findings.every((f) => f.severity === "low");
  if (onlyLowFindings) {
    const alarmPattern = /\b(flagged|danger|pose a risk|poses a risk|risky|be careful|caution|warning)\b/i;
    if (alarmPattern.test(explanation.plainEnglishExplanation ?? "")) {
      explanation.plainEnglishExplanation = assessment.findings.map((f) => f.explanation).join(" ");
    }
    if (alarmPattern.test(explanation.summary ?? "")) {
      explanation.summary = assessment.findings[0].explanation;
    }
  }

  return explanation;
}
