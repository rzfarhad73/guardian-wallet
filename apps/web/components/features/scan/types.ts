import type { ScamPatternMatch } from "@/lib/qvac/types";
import type { GuardianExplanation, RiskAssessment, RiskFinding } from "@/lib/solana/types";

export type ScanResult = {
  mode: string;
  extractedText: string;
  matches: ScamPatternMatch[];
  findings: RiskFinding[];
  assessment: RiskAssessment;
  explanation: GuardianExplanation | null;
  ocrError?: string;
  llmError?: string;
  detectedLanguage?: string;
  translatedText?: string;
  wasTranslated?: boolean;
  translationUnavailable?: boolean;
};
