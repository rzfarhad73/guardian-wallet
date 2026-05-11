/** Ordered risk tiers used across all risk assessment outputs. */
export type RiskLevel = "Low" | "Medium" | "High" | "Critical";

/** Perspective from which a transaction is being examined — affects phrasing and risk weighting. */
export type ViewerContext = "pre-sign" | "sender" | "recipient" | "viewer";

/** Normalized facts extracted from a decoded Solana transaction, ready for rule evaluation. */
export interface ParsedTransactionFacts {
  signaturesRequired?: number;
  signerAddresses: string[];
  feePayer?: string;
  programs: Array<{
    programId: string;
    label?: string;
    known: boolean;
  }>;
  instructions: ParsedInstruction[];
  transfers: AssetTransfer[];
  approvals: ApprovalChange[];
  authorityChanges: AuthorityChange[];
  unknownInstructions: ParsedInstruction[];
  summaryFacts: string[];
  memoText?: string;
}

/** A single decoded instruction with its program label and human-readable description. */
export interface ParsedInstruction {
  programId: string;
  programLabel?: string;
  type: string;
  raw?: unknown;
  accounts?: string[];
  description?: string;
}

/** A token or SOL transfer detected inside a transaction. */
export interface AssetTransfer {
  assetType: "SOL" | "SPL" | "NFT" | "Unknown";
  amount?: string;
  mint?: string;
  from?: string;
  to?: string;
}

/** A token account delegate approval detected inside a transaction. */
export interface ApprovalChange {
  tokenAccount?: string;
  delegate?: string;
  amount?: string;
  mint?: string;
}

/** An account authority transfer detected inside a transaction. */
export interface AuthorityChange {
  account?: string;
  oldAuthority?: string;
  newAuthority?: string;
  authorityType?: string;
}

/** Locally decoded asset movement, attached to RPC simulation status for pre-sign review. */
export interface SimulationAssetChange {
  assetType: AssetTransfer["assetType"];
  amount?: string;
  mint?: string;
  from?: string;
  to?: string;
  direction: "in" | "out" | "internal" | "unknown";
  description: string;
}

/** Locally decoded permission movement, attached to RPC simulation status for pre-sign review. */
export interface SimulationPermissionChange {
  type: "approval" | "authority-change";
  tokenAccount?: string;
  delegate?: string;
  amount?: string;
  mint?: string;
  account?: string;
  newAuthority?: string;
  authorityType?: string;
  description: string;
}

/** Best-effort balance delta from pre-account fetch + RPC simulation post-account data. */
export interface SimulationBalanceChange {
  assetType: "SOL" | "SPL";
  account: string;
  mint?: string;
  owner?: string;
  preAmount: string;
  postAmount: string;
  change: string;
  description: string;
}

/** RPC simulation result plus deterministic, locally decoded asset and permission effects. */
export interface SimulationResult {
  wouldSucceed: boolean;
  error?: string;
  logs?: string[];
  balanceChanges: SimulationBalanceChange[];
  assetChanges: SimulationAssetChange[];
  permissionChanges: SimulationPermissionChange[];
}

/** A single SPL token account with its current balance and optional delegate. */
export interface WalletTokenAccount {
  /** The token account public key (ATA address). Used for instructions like Revoke. */
  address: string;
  mint: string;
  balance: number;
  delegate?: string;
  delegatedAmount?: number;
}

/** On-chain facts about a wallet address fetched from Solana RPC. */
export interface WalletProfileFacts {
  address: string;
  solBalance: number;
  tokenAccounts: WalletTokenAccount[];
  recentTransactionCount: number;
  /** True when the address has no on-chain account record (never funded, never used). */
  neverFunded?: boolean;
  fetchedAt: string;
}

/** A single deterministic risk finding with severity, score impact, and evidence strings. */
export interface RiskFinding {
  id: string;
  title: string;
  severity: "low" | "medium" | "high" | "critical";
  scoreImpact: number;
  explanation: string;
  evidence: string[];
}

/** Aggregated result of applying deterministic risk rules to a set of facts. */
export interface RiskAssessment {
  score: number;
  level: RiskLevel;
  findings: RiskFinding[];
  deterministicSummary: string;
}

/** The verdict from deterministic intent-vs-execution comparison. */
export type IntentVerdict = "match" | "unclear" | "partial_mismatch" | "critical_mismatch";

/** Structured result of comparing a user's declared intent against what the transaction actually does. */
export interface IntentCheck {
  declaredIntent: string;
  actualEffect: string;
  verdict: IntentVerdict;
  reason: string;
}

/** Canonical confidence levels returned by the QVAC LLM. */
export const CONFIDENCE = {
  High: "High",
  Medium: "Medium",
  Low: "Low"
} as const;

export type ConfidenceLevel = (typeof CONFIDENCE)[keyof typeof CONFIDENCE];

/** Structured JSON explanation produced by the QVAC LLM for display in the UI. */
export interface GuardianExplanation {
  summary: string;
  riskLevel: RiskLevel;
  plainEnglishExplanation: string;
  reasons: string[];
  scamSignals?: string[];
  suggestedAction: string;
  confidence: ConfidenceLevel;
}
