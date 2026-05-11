import type { ParsedTransactionFacts, RiskFinding } from "@/lib/solana/types";

export type GuardianPolicyMode = "personal" | "dao" | "custody";

/** Sentinel value used by the UI to represent "block all outgoing SOL transfers". */
export const BLOCK_ALL_SOL_SENTINEL = 0.000001;

export interface GuardianPolicy {
  mode: GuardianPolicyMode;
  blockDelegateApprovals: boolean;
  blockUnknownPrograms: boolean;
  requireAuthorityChangeReview: boolean;
  maxSolTransfer?: number;
}

export const DEFAULT_GUARDIAN_POLICY: GuardianPolicy = {
  mode: "personal",
  blockDelegateApprovals: true,
  blockUnknownPrograms: false,
  requireAuthorityChangeReview: true,
  maxSolTransfer: 5
};

export const GUARDIAN_POLICY_PRESETS: Record<GuardianPolicyMode, GuardianPolicy> = {
  personal: DEFAULT_GUARDIAN_POLICY,
  dao: {
    mode: "dao",
    blockDelegateApprovals: true,
    blockUnknownPrograms: true,
    requireAuthorityChangeReview: true,
    maxSolTransfer: 2
  },
  custody: {
    mode: "custody",
    blockDelegateApprovals: true,
    blockUnknownPrograms: true,
    requireAuthorityChangeReview: true,
    maxSolTransfer: 1
  }
};

function toMode(value: unknown): GuardianPolicyMode {
  return value === "dao" || value === "custody" || value === "personal" ? value : "personal";
}

function toBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function toMaxSolTransfer(value: unknown, fallback?: number): number | undefined {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 1_000_000) return fallback;
  return parsed;
}

function numericAmount(amount?: string) {
  if (!amount) return 0;
  const parsed = Number(amount.replaceAll(",", ""));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export function normalizeGuardianPolicy(input: unknown): GuardianPolicy {
  const maybe = input && typeof input === "object" ? (input as Partial<GuardianPolicy>) : {};
  const mode = toMode(maybe.mode);
  const base = GUARDIAN_POLICY_PRESETS[mode];
  return {
    mode,
    blockDelegateApprovals: toBoolean(maybe.blockDelegateApprovals, base.blockDelegateApprovals),
    blockUnknownPrograms: toBoolean(maybe.blockUnknownPrograms, base.blockUnknownPrograms),
    requireAuthorityChangeReview: toBoolean(
      maybe.requireAuthorityChangeReview,
      base.requireAuthorityChangeReview
    ),
    maxSolTransfer: toMaxSolTransfer(maybe.maxSolTransfer, base.maxSolTransfer)
  };
}

export function evaluateGuardianPolicy(
  facts: ParsedTransactionFacts,
  policy: GuardianPolicy = DEFAULT_GUARDIAN_POLICY
): RiskFinding[] {
  const findings: RiskFinding[] = [];

  if (policy.blockDelegateApprovals && facts.approvals.length > 0) {
    findings.push({
      id: "policy-block-delegate-approval",
      title: "Policy blocked delegate approval",
      severity: "critical",
      scoreImpact: 40,
      explanation:
        "The active Guardian policy does not allow transactions that grant another address permission to move tokens.",
      evidence: facts.approvals.map(
        (approval) => `Delegate ${approval.delegate ?? "unknown"} amount ${approval.amount ?? "unknown"}`
      )
    });
  }

  if (policy.blockUnknownPrograms && facts.unknownInstructions.length > 0) {
    findings.push({
      id: "policy-block-unknown-program",
      title: "Policy blocked unknown program",
      severity: "high",
      scoreImpact: 25,
      explanation:
        "The active Guardian policy requires manual review before signing transactions that call unrecognized programs.",
      evidence: facts.unknownInstructions.map((instruction) => instruction.programId)
    });
  }

  if (policy.requireAuthorityChangeReview && facts.authorityChanges.length > 0) {
    findings.push({
      id: "policy-authority-change-review",
      title: "Policy requires authority-change review",
      severity: "critical",
      scoreImpact: 35,
      explanation:
        "The active Guardian policy requires explicit review for authority changes because they can transfer token or mint control.",
      evidence: facts.authorityChanges.map(
        (change) => `${change.authorityType ?? "authority"} -> ${change.newAuthority ?? "unknown"}`
      )
    });
  }

  if (policy.maxSolTransfer !== undefined) {
    const isBlockAll = policy.maxSolTransfer <= BLOCK_ALL_SOL_SENTINEL;
    const outgoingSolTransfers = facts.transfers.filter(
      (transfer) =>
        transfer.assetType === "SOL" &&
        transfer.from &&
        facts.signerAddresses.includes(transfer.from) &&
        numericAmount(transfer.amount) > policy.maxSolTransfer!
    );
    if (outgoingSolTransfers.length > 0) {
      findings.push({
        id: "policy-max-sol-transfer",
        title: isBlockAll ? "Policy blocks all outgoing SOL transfers" : "Policy transfer limit exceeded",
        severity: isBlockAll ? "critical" : "high",
        scoreImpact: isBlockAll ? 40 : 25,
        explanation: isBlockAll
          ? "The active Guardian policy blocks all outgoing SOL transfers."
          : `The active Guardian policy limits outgoing SOL transfers to ${policy.maxSolTransfer} SOL.`,
        evidence: outgoingSolTransfers.map(
          (transfer) => `${transfer.amount ?? "unknown"} SOL to ${transfer.to ?? "unknown"}`
        )
      });
    }
  }

  return findings;
}
