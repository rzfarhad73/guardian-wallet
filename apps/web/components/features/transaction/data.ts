import type { ViewerContext } from "@/lib/solana/types";

export type TransactionSample = {
  label: string;
  sig: string;
  intent: string;
  risk: "low" | "medium" | "high";
  group: "safe" | "scam";
};

export const TRANSACTION_SAMPLES: TransactionSample[] = [
  {
    label: "SOL transfer",
    sig: "AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAEDfowIh2C/3h3dzzLBfyCbgkLuUqrxMfrNiNDqLG0LBvJIwBtQWQBUVdncsMa87Ny0+1suq8GpqCtXOSuqpA8E5gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAgIAAQwCAAAAgJaYAAAAAAA=",
    intent: "Send 0.01 SOL to a friend",
    risk: "low",
    group: "safe"
  },
  {
    label: "Token transfer",
    sig: "2MEZoH9zBuFMLEX8ZgJE3CpofzUsmQ1u2XgLpzK61mqaTCXb6t2gZu8KCShxSJcLDoGz5t1nfQo5w38StrKiA8cf",
    intent: "Transfer my tokens",
    risk: "low",
    group: "safe"
  },
  {
    label: "Jupiter swap",
    sig: "24Ftin2PsxN5torZq3ncgNSiyCBtfv78i3EbDJx9pqDq74WrCf3qZFJFTV6SRkFD5r5PR3EFPYCZCtu9uGx6iiZi",
    intent: "Swap SOL for USDC",
    risk: "low",
    group: "safe"
  },
  {
    label: "⚠ Unlimited delegate approval",
    sig: "AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAIEfowIh2C/3h3dzzLBfyCbgkLuUqrxMfrNiNDqLG0LBvJnUgVcILPp2HRmVt33OFVQf4erbYdSPkx2p/o2CWqZ6/MjqE4sbn+ssQwFIQzGQJaG0wND8vuA1OV39+OazvpmBt324ddloZPZy+FGzut5rBy0he1fWzeROoz1hX7/AKnMSQ6SjNLjhzuzQ/yV2jMXnKYPTb9GwsNukSmdVdTmuQEDAwECAAkE//////////8=",
    intent: "Claim my free airdrop reward",
    risk: "high",
    group: "scam"
  }
];

export const CONTEXT_OPTIONS: { value: ViewerContext; label: string; description: string }[] = [
  {
    value: "pre-sign",
    label: "About to sign",
    description: "I am about to sign this transaction — should I proceed?"
  },
  {
    value: "sender",
    label: "I sent this",
    description: "I already sent this — reviewing it in hindsight."
  },
  {
    value: "recipient",
    label: "I received this",
    description: "Assets were sent to me — I did not initiate this."
  },
  {
    value: "viewer",
    label: "Just looking",
    description: "I have no involvement — I am inspecting someone else's transaction."
  }
];
