import type { GuardianExplanation, RiskAssessment, WalletProfileFacts } from "@/lib/solana/types";

export type WalletResult = {
  mode: string;
  facts: WalletProfileFacts;
  assessment: RiskAssessment;
  explanation: GuardianExplanation;
};
