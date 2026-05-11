import type { RiskAssessment, RiskFinding, RiskLevel } from "../solana/types";
import type { ScamPatternMatch } from "../qvac/types";

const RAG_SEVERITY_BASE_SCORE: Record<string, number> = {
  critical: 50,
  high: 35,
  medium: 20,
  low: 8
};

/**
 * Converts RAG pattern matches to RiskFindings so they contribute to the score.
 * Only emits a finding when the match isn't already covered by a deterministic finding
 * with the same id, to avoid double-counting.
 */
export function ragMatchesToFindings(
  matches: ScamPatternMatch[],
  existingFindings: RiskFinding[]
): RiskFinding[] {
  const existingIds = new Set(existingFindings.map((f) => f.id));
  return matches
    .filter((m) => !existingIds.has(m.id))
    .map((m) => ({
      id: m.id,
      title: m.title,
      severity: m.severity,
      scoreImpact: Math.round((RAG_SEVERITY_BASE_SCORE[m.severity] ?? 20) * m.similarity),
      explanation: m.text,
      evidence: [`Matched scam pattern at ${Math.round(m.similarity * 100)}% confidence`]
    }));
}

export function riskLevelFromScore(score: number): RiskLevel {
  if (score >= 80) return "Critical";
  if (score >= 50) return "High";
  if (score >= 25) return "Medium";
  return "Low";
}

export function scoreFindings(findings: RiskFinding[]): RiskAssessment {
  const score = Math.min(
    100,
    Math.max(
      0,
      findings.reduce((total, finding) => total + finding.scoreImpact, 0)
    )
  );
  const level = riskLevelFromScore(score);
  const highSeverityCount = findings.filter((f) => f.severity !== "low").length;
  const totalCount = findings.length;
  return {
    score,
    level,
    findings,
    deterministicSummary:
      totalCount === 0
        ? "No deterministic warning signs found."
        : highSeverityCount === 0
          ? `No high-severity warning signs found (${totalCount} low-severity note${totalCount > 1 ? "s" : ""}).`
          : totalCount === highSeverityCount
            ? `${highSeverityCount} warning sign${highSeverityCount > 1 ? "s" : ""} found.`
            : `${highSeverityCount} warning sign${highSeverityCount > 1 ? "s" : ""} found (${totalCount - highSeverityCount} additional low-severity note${totalCount - highSeverityCount > 1 ? "s" : ""}).`
  };
}
