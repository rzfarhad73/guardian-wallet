import type {
  GuardianExplanation,
  IntentCheck,
  ParsedTransactionFacts,
  RiskAssessment,
  SimulationResult,
  ViewerContext
} from "@/lib/solana/types";
import type { GuardianPolicy } from "@/lib/risk/policy";

export type TransactionResult = {
  mode: string;
  context: ViewerContext;
  policy: GuardianPolicy;
  intentCheck?: IntentCheck;
  facts: ParsedTransactionFacts;
  assessment: RiskAssessment;
  explanation: GuardianExplanation;
  simulationResult?: SimulationResult;
};
