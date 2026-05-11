import type { ParsedTransactionFacts, RiskFinding, ViewerContext } from "../types";
import {
  checkMaliciousProgram,
  checkUnknownProgram,
  checkTokenApproval,
  checkAuthorityChange,
  checkPumpFunAuthorityChange,
  checkMultipleAssets,
  checkHighValueTransfer,
  checkSuspiciousText,
  checkSpamBotMemo,
  checkScatterTransfer,
  checkFallbacks,
  checkDexBaseline
} from "./rules";

export { numericAmount } from "./helpers";

/**
 * Run all deterministic risk rules against a parsed transaction.
 * Returns an ordered list of RiskFinding objects — the caller is responsible
 * for scoring them via scoreRisk().
 */
export function evaluateTransactionRisk(
  facts: ParsedTransactionFacts,
  context: ViewerContext = "pre-sign"
): RiskFinding[] {
  const primary: RiskFinding[] = [
    ...checkMaliciousProgram(facts),
    ...checkUnknownProgram(facts),
    ...checkTokenApproval(facts),
    ...checkAuthorityChange(facts),
    ...checkPumpFunAuthorityChange(facts),
    ...checkMultipleAssets(facts, context),
    ...checkHighValueTransfer(facts),
    ...checkSuspiciousText(facts),
    ...checkSpamBotMemo(facts),
    ...checkScatterTransfer(facts, context)
  ];

  const withFallbacks = [...primary, ...checkFallbacks(facts, primary, context)];
  return [...withFallbacks, ...checkDexBaseline(facts, withFallbacks)];
}
