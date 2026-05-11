import type { RiskFinding, WalletProfileFacts } from "./types";

const DUST_THRESHOLD_SOL = 0.001;
const DELEGATE_ALERT_COUNT = 5;

// Addresses confirmed as exploit recipients, hack wallets, or flagged scammers.
// Sources: public post-mortems, Solscan exploit reports, on-chain forensics.
const KNOWN_BAD_ACTORS: Record<string, { label: string; detail: string }> = {
  // Wormhole bridge exploit Feb 2022 — attacker received ~120,000 wSOL (~$320M)
  Htp9MGP8Tig923ZFY7Qf2zzbMUmYneFRAhSp7vSg4wxV: {
    label: "Wormhole exploit recipient",
    detail: "Received ~120,000 wSOL in the Feb 2022 Wormhole bridge exploit (~$320M at the time)"
  },
  // Mango Markets exploiter Oct 2022
  "4ND8FVPjUGGjx9VuGFuJefDWpg3THb58c277hbVRnjNa": {
    label: "Mango Markets exploiter",
    detail: "Exploited Mango Markets oracle manipulation for ~$114M in Oct 2022"
  }
};

export function evaluateWalletRisk(facts: WalletProfileFacts): RiskFinding[] {
  const findings: RiskFinding[] = [];

  // Check against known bad actors first — this is deterministic and highest priority
  const knownBad = KNOWN_BAD_ACTORS[facts.address];
  if (knownBad) {
    findings.push({
      id: "known-bad-actor",
      title: "Known exploit or hack address",
      severity: "critical",
      scoreImpact: 80,
      explanation:
        `This address is flagged as a known bad actor based on public blockchain forensics. ${knownBad.detail}. ` +
        "Do not send funds to or accept funds from this address.",
      evidence: [knownBad.label]
    });
  }

  if (facts.neverFunded) {
    findings.push({
      id: "never-funded",
      title: "Address has no on-chain history",
      severity: "low",
      scoreImpact: 5,
      explanation:
        "This address has never been funded or used on Solana mainnet. It may be a freshly generated wallet or a typo. Double-check the address before sending funds to it.",
      evidence: ["No on-chain account record found"]
    });
    // Still run delegate check — a never-funded wallet with a delegate is a sign of a pre-configured drainer
    const delegatedAccounts = facts.tokenAccounts.filter((t) => t.delegate);
    if (delegatedAccounts.length > 0) {
      findings.push({
        id: "active-token-delegate",
        title: "Active token delegate on unfunded wallet",
        severity: "critical",
        scoreImpact: 60,
        explanation:
          "This unfunded address already has token accounts with active delegates. This is a hallmark of a pre-configured wallet drainer address.",
        evidence: delegatedAccounts.map((t) => `Mint ${t.mint}: delegate ${t.delegate}`)
      });
    }
    return findings;
  }

  const delegatedAccounts = facts.tokenAccounts.filter((t) => t.delegate);
  if (delegatedAccounts.length > 0) {
    findings.push({
      id: "active-token-delegate",
      title: "Active token delegate(s) detected",
      severity: "high",
      scoreImpact: 40,
      explanation:
        "One or more token accounts have an active delegate — a third party with permission to transfer tokens from this wallet. This is the mechanism used by wallet drainers. Revoke any delegate you did not intentionally set.",
      evidence: delegatedAccounts.map(
        (t) =>
          `Mint ${t.mint}: delegate ${t.delegate}${t.delegatedAmount != null ? ` (approved amount: ${t.delegatedAmount})` : ""}`
      )
    });
  }

  if (facts.solBalance < DUST_THRESHOLD_SOL && facts.tokenAccounts.some((t) => t.balance > 0)) {
    findings.push({
      id: "low-sol-for-fees",
      title: "Insufficient SOL for transaction fees",
      severity: "medium",
      scoreImpact: 15,
      explanation:
        "This wallet holds tokens but has very little SOL. Without SOL for fees, any legitimate transaction will fail. This is sometimes a sign of a dust attack — small SOL deposits used to trigger interactions.",
      evidence: [`SOL balance: ${facts.solBalance.toFixed(6)}`]
    });
  }

  if (facts.recentTransactionCount >= 40) {
    findings.push({
      id: "high-recent-activity",
      title: "High recent transaction volume",
      severity: "low",
      scoreImpact: 10,
      explanation:
        "This wallet has had significant recent activity. Review recent transactions to confirm they were all intentional.",
      evidence: [
        facts.recentTransactionCount >= 50
          ? "50+ transactions in recent history"
          : `${facts.recentTransactionCount} transactions in recent history`
      ]
    });
  }

  const dustAccounts = facts.tokenAccounts.filter((t) => t.balance <= DUST_THRESHOLD_SOL);
  if (dustAccounts.length >= DELEGATE_ALERT_COUNT) {
    findings.push({
      id: "dust-spam-tokens",
      title: "Possible dust or spam tokens detected",
      severity: "low",
      scoreImpact: 5,
      explanation:
        "This wallet holds multiple token accounts with zero or near-zero balances. Dust attacks send tiny token amounts to wallets to track activity, trigger interactions, or phish users into visiting malicious sites. Do not interact with tokens you did not expect to receive.",
      evidence: [`${dustAccounts.length} token accounts with zero or dust balance (≤ ${DUST_THRESHOLD_SOL})`]
    });
  }

  return findings;
}
