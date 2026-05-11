export const KNOWN_SOLANA_PROGRAMS: Record<string, string> = {
  "11111111111111111111111111111111": "System Program",
  TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA: "SPL Token Program",
  ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL: "Associated Token Account Program",
  TokenzQdBNbLqP5VEhdkAS6EPQj8XDPxQhR8Qo9b8r1: "Token-2022 Program",
  MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr: "Memo Program",
  ComputeBudget111111111111111111111111111111: "Compute Budget Program",
  AddressLookupTab1e1111111111111111111111111: "Address Lookup Table Program",

  // DEX aggregators
  JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4: "Jupiter Aggregator v6",
  JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN: "Jupiter Limit Order",
  jupoNjAxXgZ4rjzxzPMP4oxduvQsQtZzyknqvzYNrNi: "Jupiter DCA",

  // Raydium
  "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8": "Raydium AMM v4",
  "5quBtoiQqxF9Jv6KYKctB59NT3gtJD2Y65kdnB1Uonc": "Raydium AMM v3",
  CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK: "Raydium CLMM",
  routeUGWgWzqBWFcrCfv8tritsqukccJPu3q5GPP3xS: "Raydium Route",

  // Orca
  whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc: "Orca Whirlpools",
  "9W959DqEETiGZocYWCQPaJ6sBmUzgfxXfqGeTEdp3aQP": "Orca v2",

  // Metaplex
  metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s: "Metaplex Token Metadata",
  hausS13jsjafwWwGqZTUQRmWyvyxn9EQpqMwV1PBBmk: "Metaplex Auction House",
  cndy3Z4yapfJBmL3ShUp5exZKqR3z33thTzeNMm2gRZ: "Metaplex Candy Machine v2",
  CndyV3LdqHUfDLmd1X2Rp7V4dSPBDHwBkmgK39JtJFek: "Metaplex Candy Machine v3",
  M2mx93ekt1fmXSVkTrUL9xVFHkmME8HTUi5Cyc5aF7K: "Magic Eden v2",

  // Staking & validators
  Stake11111111111111111111111111111111111111: "Stake Program",
  StakeConfig11111111111111111111111111111111: "Stake Config",
  Vote111111111111111111111111111111111111111: "Vote Program",

  // Sysvars
  SysvarC1ock11111111111111111111111111111111: "Sysvar: Clock",
  SysvarRent111111111111111111111111111111111: "Sysvar: Rent",
  SysvarRecentB1ockHashes11111111111111111111: "Sysvar: Recent Block Hashes",
  SysvarS1otHashes111111111111111111111111111: "Sysvar: Slot Hashes",
  SysvarEpochSchedu1e111111111111111111111111: "Sysvar: Epoch Schedule",
  SysvarFees111111111111111111111111111111111: "Sysvar: Fees",

  // Pump.fun
  "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P": "Pump.fun",
  cpamdpZCGKUy5JxQXB4dcpGPiikHawvSWAd6mEn1sGG: "Pump.fun AMM",

  // Other well-known programs
  namesLPneVptA9Z5rqUDD9tMTWEJwofgaYwp8cawRkX: "Solana Name Service",
  PhoeNiXZ8ByJGLkxNfZRnkUfjvmuYqLR89jjFHGqdXY: "Phoenix DEX",
  "4MangoMjqJ2firMokCjjGgoK8d4MXcrgL7XJaL3w6fVg": "Mango Markets v4",
  DjVE6JNiYqPL2QXyCUUh8rNjHrbz9hXHNYt99MQ59qw1: "Orca Token Swap v1",
  obriQD1zbpyLz95G5n7nJe6a4DPjpFwa5XYPoNm113y: "OpenBook DEX",
  srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX: "Serum DEX v3"
};
/*
 * Known malicious Solana program IDs.
 *
 * This list must be populated ONLY from verified, primary-source threat intelligence:
 * - OtterSec incident reports: https://osec.io/blog
 * - Blowfish threat database: https://blowfish.xyz
 * - Helius security advisories: https://helius.dev
 * - On-chain forensics (Solscan / SolanaFM flagged programs)
 *
 * DO NOT add addresses without a verifiable public source.
 * Each entry: programId → human-readable campaign/kit name with source reference
 */
export const KNOWN_MALICIOUS_PROGRAMS: Record<string, string> = {
  // Add verified malicious program IDs here from primary sources only
};
export function classifyProgram(programId: string) {
  const label = KNOWN_SOLANA_PROGRAMS[programId];
  return {
    programId,
    label,
    known: Boolean(label)
  };
}
