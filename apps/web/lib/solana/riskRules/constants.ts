/** Known Pump.fun program IDs used for rug-pull detection. */
export const PUMP_FUN_PROGRAM_IDS = new Set([
  "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P",
  "cpamdpZCGKUy5JxQXB4dcpGPiikHawvSWAd6mEn1sGG"
]);

/** Matches phishing / social-engineering keywords embedded in memos. */
export const SUSPICIOUS_MEMO_RE =
  /\b(seed phrase|private key|validate|synchronize|restore|urgent|airdrop|claim now)\b/i;

/** Matches on-chain spam bot / wash-trading advertisement keywords. */
export const SPAM_BOT_MEMO_RE =
  /\b(volume bot|trading bot|boost|free trial|push \d|10m|100k|wash|fake volume|market maker bot|sniper bot|copy trading)\b/i;

/** Score impacts for each risk rule — tuned so scores land in correct risk bands. */
export const SCORE = {
  MALICIOUS_PROGRAM: 80,
  UNKNOWN_PROGRAM_WITH_PERMISSIONS: 80, // drainer pattern → Critical alone
  TOKEN_APPROVAL: 50,
  AUTHORITY_CHANGE: 65, // full control transfer → High alone, Critical when combined
  SPAM_BOT_MEMO: 35,
  UNKNOWN_PROGRAM_WITH_MULTI_TRANSFER: 30,
  MULTIPLE_ASSETS: 30,
  HIGH_VALUE_TRANSFER: 25,
  SUSPICIOUS_TEXT: 30,
  SCATTER_TRANSFER: 30,
  UNKNOWN_PROGRAM_SOLO: 25,
  NO_INSTRUCTIONS: 20,
  DEX_SWAP_BASELINE: 15
} as const;

/** Asset-value thresholds that trigger the large-transfer finding. */
export const THRESHOLD = {
  HIGH_VALUE_SOL: 5,
  HIGH_VALUE_TOKEN: 1000
} as const;
