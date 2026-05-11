import type { ParsedTransactionFacts, RiskFinding, ViewerContext } from "../types";
import { KNOWN_MALICIOUS_PROGRAMS } from "../classifyInstruction";
import { DEX_PROGRAM_IDS } from "@/lib/risk/intentCheck";
import { PUMP_FUN_PROGRAM_IDS, SUSPICIOUS_MEMO_RE, SPAM_BOT_MEMO_RE, SCORE, THRESHOLD } from "./constants";
import { numericAmount } from "./helpers";

export { numericAmount } from "./helpers";

export function checkMaliciousProgram(facts: ParsedTransactionFacts): RiskFinding[] {
  const malicious = facts.programs.filter((p) => KNOWN_MALICIOUS_PROGRAMS[p.programId]);
  if (!malicious.length) return [];
  return [
    {
      id: "known-malicious-program",
      title: "Known malicious program detected",
      severity: "critical",
      scoreImpact: SCORE.MALICIOUS_PROGRAM,
      explanation:
        "This transaction invokes a program that has been identified as malicious in public threat intelligence reports. Do not sign this transaction.",
      evidence: malicious.map((p) => `${KNOWN_MALICIOUS_PROGRAMS[p.programId]} — ${p.programId}`)
    }
  ];
}

export function checkUnknownProgram(facts: ParsedTransactionFacts): RiskFinding[] {
  const unknownPrograms = facts.programs.filter((p) => !p.known);
  if (!unknownPrograms.length) return [];

  const withApprovalOrAuthority = facts.approvals.length > 0 || facts.authorityChanges.length > 0;
  return [
    {
      id: "unknown-program",
      title: withApprovalOrAuthority
        ? "Unknown program requesting wallet permissions"
        : "Unknown program interaction",
      severity: withApprovalOrAuthority ? "critical" : facts.transfers.length > 1 ? "high" : "medium",
      scoreImpact: withApprovalOrAuthority
        ? SCORE.UNKNOWN_PROGRAM_WITH_PERMISSIONS
        : facts.approvals.length || facts.transfers.length > 1
          ? SCORE.UNKNOWN_PROGRAM_WITH_MULTI_TRANSFER
          : SCORE.UNKNOWN_PROGRAM_SOLO,
      explanation: withApprovalOrAuthority
        ? "An unrecognized program is requesting permission to move tokens from your wallet. This is the primary mechanism used by wallet drainers."
        : "Unknown program. This does not automatically mean malicious, but it requires caution.",
      evidence: unknownPrograms.map((p) => p.programId)
    }
  ];
}

export function checkTokenApproval(facts: ParsedTransactionFacts): RiskFinding[] {
  if (!facts.approvals.length) return [];
  return [
    {
      id: "token-approval",
      title: "Token delegate approval",
      severity: "high",
      scoreImpact: SCORE.TOKEN_APPROVAL,
      explanation: "The transaction grants another address permission to move tokens from your account.",
      evidence: facts.approvals.map(
        (a) => `Delegate ${a.delegate ?? "unknown"} amount ${a.amount ?? "unknown"}`
      )
    }
  ];
}

export function checkAuthorityChange(facts: ParsedTransactionFacts): RiskFinding[] {
  if (!facts.authorityChanges.length) return [];
  return [
    {
      id: "authority-change",
      title: "Token authority change",
      severity: "critical",
      scoreImpact: SCORE.AUTHORITY_CHANGE,
      explanation: "Authority changes can transfer control of a token account or mint.",
      evidence: facts.authorityChanges.map(
        (c) => `${c.authorityType ?? "authority"} -> ${c.newAuthority ?? "unknown"}`
      )
    }
  ];
}

export function checkPumpFunAuthorityChange(facts: ParsedTransactionFacts): RiskFinding[] {
  const hasPumpFun = facts.programs.some((p) => PUMP_FUN_PROGRAM_IDS.has(p.programId));
  if (!hasPumpFun || !facts.authorityChanges.length) return [];
  return [
    {
      id: "pumpfun-authority-change",
      title: "Pump.fun token with authority change",
      severity: "high",
      scoreImpact: 35,
      explanation:
        "A Pump.fun interaction combined with an authority change is a common rug pull pattern. " +
        "The token creator may be transferring mint or freeze authority to lock out holders.",
      evidence: facts.authorityChanges.map(
        (c) => `${c.authorityType ?? "authority"} → ${c.newAuthority ?? "unknown"}`
      )
    }
  ];
}

export function checkMultipleAssets(facts: ParsedTransactionFacts, context: ViewerContext): RiskFinding[] {
  const isPassiveContext = context === "recipient" || context === "viewer";
  const isDustOnly =
    facts.transfers.length > 0 &&
    facts.transfers.every((t) => t.assetType === "SOL" && numericAmount(t.amount) < 0.001);
  const hasPermissionRequest = facts.approvals.length > 0 || facts.authorityChanges.length > 0;
  const hasNFT = facts.transfers.some((t) => t.assetType === "NFT");

  if (
    isPassiveContext ||
    isDustOnly ||
    (!hasPermissionRequest && !hasNFT) ||
    (facts.transfers.length < 2 && !hasNFT)
  ) {
    return [];
  }

  return [
    {
      id: "multiple-assets",
      title: "Multiple asset movement",
      severity: "high",
      scoreImpact: SCORE.MULTIPLE_ASSETS,
      explanation: "Moving several assets in one signature is common in wallet-drainer flows.",
      evidence: facts.transfers.map(
        (t) => `${t.amount ?? "unknown"} ${t.assetType}${t.mint ? ` ${t.mint}` : ""}`
      )
    }
  ];
}

export function checkHighValueTransfer(facts: ParsedTransactionFacts): RiskFinding[] {
  const highValue = facts.transfers.filter(
    (t) =>
      (t.assetType === "SOL" && numericAmount(t.amount) >= THRESHOLD.HIGH_VALUE_SOL) ||
      (t.assetType !== "SOL" && numericAmount(t.amount) >= THRESHOLD.HIGH_VALUE_TOKEN)
  );
  if (!highValue.length) return [];
  return [
    {
      id: "high-value-transfer",
      title: "Large transfer",
      severity: "medium",
      scoreImpact: SCORE.HIGH_VALUE_TRANSFER,
      explanation: `Transfer amount exceeds review threshold (${THRESHOLD.HIGH_VALUE_SOL} SOL / ${THRESHOLD.HIGH_VALUE_TOKEN} tokens). Verify the destination address before signing.`,
      evidence: highValue.map((t) => `${t.amount ?? "unknown"} ${t.assetType} to ${t.to ?? "unknown"}`)
    }
  ];
}

export function checkSuspiciousText(facts: ParsedTransactionFacts): RiskFinding[] {
  const suspiciousInstructions = facts.instructions.filter(
    (ix) =>
      SUSPICIOUS_MEMO_RE.test(ix.description ?? "") || SUSPICIOUS_MEMO_RE.test(JSON.stringify(ix.raw ?? ""))
  );
  const memoIsSuspicious = facts.memoText ? SUSPICIOUS_MEMO_RE.test(facts.memoText) : false;
  if (!suspiciousInstructions.length && !memoIsSuspicious) return [];

  return [
    {
      id: "suspicious-text",
      title: "Suspicious instruction text",
      severity: "high",
      scoreImpact: SCORE.SUSPICIOUS_TEXT,
      explanation: "Text attached to the transaction contains language often used in scams.",
      evidence: [
        ...suspiciousInstructions.map((ix) => ix.description ?? ix.type),
        ...(memoIsSuspicious && facts.memoText ? [facts.memoText] : [])
      ]
    }
  ];
}

export function checkSpamBotMemo(facts: ParsedTransactionFacts): RiskFinding[] {
  const memoTexts = [facts.memoText ?? "", ...facts.instructions.map((ix) => ix.description ?? "")].join(" ");
  if (!SPAM_BOT_MEMO_RE.test(memoTexts)) return [];

  return [
    {
      id: "spam-bot-memo",
      title: "On-chain spam or bot advertisement",
      severity: "high",
      scoreImpact: SCORE.SPAM_BOT_MEMO,
      explanation:
        "The memo attached to this transaction advertises a volume bot, trading bot, or other spam service. " +
        "These services artificially inflate trading activity and are frequently used in pump-and-dump schemes.",
      evidence: [facts.memoText ?? memoTexts.slice(0, 200)]
    }
  ];
}

export function checkScatterTransfer(facts: ParsedTransactionFacts, context: ViewerContext): RiskFinding[] {
  const uniqueRecipients = new Set(facts.transfers.map((t) => t.to).filter(Boolean));
  if (facts.transfers.length < 5 || uniqueRecipients.size < 4) return [];

  const explanations: Record<string, string> = {
    recipient:
      `This transaction scattered ${uniqueRecipients.size} tiny transfers to different wallets including yours. ` +
      "This is a dust attack or bot spam campaign. Do not interact with any tokens or links from this sender.",
    viewer:
      `This transaction scattered ${uniqueRecipients.size} tiny transfers across different wallets as part of a bot spam campaign. ` +
      "This is consistent with a dust attack or volume-bot advertisement.",
    sender:
      `This transaction sent to ${uniqueRecipients.size} different recipients. ` +
      "Scatter transfers are associated with wash-trading bots and dust attack campaigns."
  };

  return [
    {
      id: "scatter-transfer",
      title:
        context === "recipient"
          ? "Dust attack / scatter spam received"
          : context === "viewer"
            ? "Mass scatter transfer (bot spam campaign)"
            : "Mass scatter transfer",
      severity: "high",
      scoreImpact: SCORE.SCATTER_TRANSFER,
      explanation:
        explanations[context] ??
        `This transaction sends to ${uniqueRecipients.size} different recipients. ` +
          "Scatter transfers are used by wash-trading bots, dust attack campaigns, and drainer wallets.",
      evidence: [`${facts.transfers.length} transfers to ${uniqueRecipients.size} unique recipients`]
    }
  ];
}

/** Fallback findings applied only when no other rules fired. */
export function checkFallbacks(
  facts: ParsedTransactionFacts,
  currentFindings: RiskFinding[],
  context: ViewerContext
): RiskFinding[] {
  if (currentFindings.length) return [];
  const isHistorical = context === "sender" || context === "recipient" || context === "viewer";

  if (facts.transfers.length === 1 && facts.transfers[0]?.assetType === "SOL") {
    return [
      {
        id: "simple-known-sol-transfer",
        title: isHistorical ? "Simple SOL transfer (historical)" : "Simple SOL transfer",
        severity: "low",
        scoreImpact: 0,
        explanation:
          "The transaction appears to be a simple SOL transfer with no approvals or unknown programs.",
        evidence: facts.summaryFacts
      }
    ];
  }

  if (facts.instructions.length === 0 && facts.programs.length === 0) {
    return [
      {
        id: "no-instructions",
        title: "Transaction contains no instructions",
        severity: "medium",
        scoreImpact: SCORE.NO_INSTRUCTIONS,
        explanation:
          "This transaction has no decoded instructions. It may be malformed, corrupted, or from an unsupported program layout.",
        evidence: ["0 instructions decoded"]
      }
    ];
  }

  return [];
}

/** DEX baseline — appended only when no high/critical findings are present. */
export function checkDexBaseline(
  facts: ParsedTransactionFacts,
  currentFindings: RiskFinding[]
): RiskFinding[] {
  const hasDex = facts.programs.some((p) => DEX_PROGRAM_IDS.has(p.programId));
  if (!hasDex) return [];
  if (currentFindings.some((f) => f.severity === "critical" || f.severity === "high")) return [];

  return [
    {
      id: "dex-swap-complexity",
      title: "DEX swap — verify output token and slippage",
      severity: "low",
      scoreImpact: SCORE.DEX_SWAP_BASELINE,
      explanation:
        "A known DEX program was detected. Legitimate swaps still carry inherent risks: MEV sandwich attacks, price impact, and slippage. Confirm the output token and acceptable slippage before signing.",
      evidence: facts.programs
        .filter((p) => DEX_PROGRAM_IDS.has(p.programId))
        .map((p) => p.label ?? p.programId)
    }
  ];
}
