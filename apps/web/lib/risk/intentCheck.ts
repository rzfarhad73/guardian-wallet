// Keyword rules are intentionally conservative to minimise false positives.
// The LLM explanation layer handles ambiguous cases.
import type { IntentCheck, IntentVerdict, ParsedTransactionFacts } from "@/lib/solana/types";

const CLAIM_KEYWORDS = ["claim", "airdrop", "reward", "mint", "free token"];
const SWAP_KEYWORDS = ["swap", "exchange", "trade", "convert"];
const CONNECT_KEYWORDS = ["connect", "verify", "login", "sign in", "authenticate", "validate", "link"];
const STAKE_KEYWORDS = ["stake", "staking", "deposit", "unstake"];
const SEND_KEYWORDS = ["send", "transfer", "pay"];

// Known DEX / swap program IDs — presence confirms a swap intent matches
export const DEX_PROGRAM_IDS = new Set([
  "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4", // Jupiter v6
  "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN", // Jupiter Limit Order
  "jupoNjAxXgZ4rjzxzPMP4oxduvQsQtZzyknqvzYNrNi", // Jupiter DCA
  "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8", // Raydium AMM v4
  "5quBtoiQqxF9Jv6KYKctB59NT3gtJD2Y65kdnB1Uonc", // Raydium AMM v3
  "CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK", // Raydium CLMM
  "routeUGWgWzqBWFcrCfv8tritsqukccJPu3q5GPP3xS", // Raydium Route
  "whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc", // Orca Whirlpools
  "9W959DqEETiGZocYWCQPaJ6sBmUzgfxXfqGeTEdp3aQP", // Orca v2
  "PhoeNiXZ8ByJGLkxNfZRnkUfjvmuYqLR89jjFHGqdXY", // Phoenix DEX
  "obriQD1zbpyLz95G5n7nJe6a4DPjpFwa5XYPoNm113y", // OpenBook
  "DjVE6JNiYqPL2QXyCUUh8rNjHrbz9hXHNYt99MQ59qw1" // Orca v1
]);

function containsAny(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((k) => lower.includes(k));
}

function describeEffect(facts: ParsedTransactionFacts): string {
  const parts: string[] = [];
  if (facts.approvals.length > 0)
    parts.push(
      `approves a token delegate (${facts.approvals.length} account${facts.approvals.length > 1 ? "s" : ""})`
    );
  if (facts.authorityChanges.length > 0) parts.push("changes token authority");
  if (facts.transfers.length > 0)
    parts.push(`transfers ${facts.transfers.length} asset${facts.transfers.length > 1 ? "s" : ""}`);
  if (facts.programs.some((p) => DEX_PROGRAM_IDS.has(p.programId)))
    parts.push("performs a token swap via a DEX");
  else if (facts.programs.some((p) => !p.known)) parts.push("interacts with an unrecognized program");
  return parts.length > 0 ? parts.join(", ") : "performs an on-chain operation";
}

function make(userIntent: string, actualEffect: string, verdict: IntentVerdict, reason: string): IntentCheck {
  return { declaredIntent: userIntent, actualEffect, verdict, reason };
}

export function checkIntent(userIntent: string, facts: ParsedTransactionFacts): IntentCheck {
  const intent = userIntent.slice(0, 500);
  const actualEffect = describeEffect(facts);
  const hasDelegate = facts.approvals.length > 0;
  const hasAuthorityChange = facts.authorityChanges.length > 0;
  const transferCount = facts.transfers.length;

  if (containsAny(intent, CLAIM_KEYWORDS)) {
    if (hasDelegate || hasAuthorityChange) {
      return make(
        intent,
        actualEffect,
        "critical_mismatch",
        "Claiming a reward or airdrop should not require approving a token delegate or changing an authority. This pattern is used by wallet drainers."
      );
    }
  }

  if (containsAny(intent, SWAP_KEYWORDS)) {
    if (hasDelegate || hasAuthorityChange) {
      return make(
        intent,
        actualEffect,
        "critical_mismatch",
        "A token swap does not require granting delegate permissions. This transaction requests broader access than a swap needs."
      );
    }
    if (transferCount > 3) {
      return make(
        intent,
        actualEffect,
        "partial_mismatch",
        "A single swap typically involves two assets. This transaction moves more assets than expected."
      );
    }
    // Positive match: a known DEX program is present — this is a real swap
    const hasDex = facts.programs.some((p) => DEX_PROGRAM_IDS.has(p.programId));
    if (hasDex) {
      return make(
        intent,
        actualEffect,
        "match",
        "A known DEX program was detected. This transaction is consistent with a token swap."
      );
    }
  }

  if (containsAny(intent, CONNECT_KEYWORDS)) {
    if (hasDelegate || hasAuthorityChange) {
      return make(
        intent,
        actualEffect,
        "critical_mismatch",
        "Connecting a wallet should not modify token permissions. This transaction makes on-chain changes that go beyond a connection request."
      );
    }
  }

  if (containsAny(intent, STAKE_KEYWORDS)) {
    if (hasDelegate) {
      return make(
        intent,
        actualEffect,
        "partial_mismatch",
        "Staking interacts with stake programs directly. Approving a token delegate is not normally part of a staking operation."
      );
    }
  }

  if (containsAny(intent, SEND_KEYWORDS)) {
    if (hasDelegate || hasAuthorityChange) {
      return make(
        intent,
        actualEffect,
        "critical_mismatch",
        "Sending tokens does not require granting permissions to another address. This transaction requests more access than a transfer needs."
      );
    }
    if (transferCount === 0 && facts.programs.length > 0) {
      return make(
        intent,
        actualEffect,
        "partial_mismatch",
        "The stated intent is to send or transfer assets, but no asset movement was detected in this transaction. Verify what this transaction actually does before signing."
      );
    }
    if (transferCount === 1) {
      return make(
        intent,
        actualEffect,
        "match",
        "The transaction performs a single asset transfer, consistent with the stated intent."
      );
    }
  }

  return make(
    intent,
    actualEffect,
    "unclear",
    "The intent could not be deterministically matched against the transaction effects. Review the risk findings and explanation below."
  );
}
