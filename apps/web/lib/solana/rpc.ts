/**
 * Shared Solana RPC URL resolution.
 * Used by both parseTransaction and walletProfile to avoid duplication.
 */
export function getSolanaRpc(): string {
  const url = process.env.SOLANA_RPC_URL;
  if (!url) return "https://api.mainnet-beta.solana.com";
  try {
    const parsed = new URL(url);
    if (/^(169\.254\.|metadata\.google\.internal$)/i.test(parsed.hostname)) {
      console.error(`[Guardian] SOLANA_RPC_URL blocked: ${parsed.hostname}`);
      return "https://api.mainnet-beta.solana.com";
    }
    return url;
  } catch {
    console.error("[Guardian] SOLANA_RPC_URL invalid, using default");
    return "https://api.mainnet-beta.solana.com";
  }
}

export const SOLANA_RPC = getSolanaRpc();
