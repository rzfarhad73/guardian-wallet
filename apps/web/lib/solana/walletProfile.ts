import { Connection, PublicKey } from "@solana/web3.js";
import type { WalletProfileFacts, WalletTokenAccount } from "./types";
import { SOLANA_RPC } from "./rpc";
const SPL_TOKEN_PROGRAM_ID_STR = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
const TOKEN_2022_PROGRAM_ID_STR = "TokenzQdBNbequvEiPDBSpAkPVqcDaD4h5s6GVZCh6MB";
const SYSTEM_PROGRAM_ID = "11111111111111111111111111111111";
const STAKE_PROGRAM_ID = "Stake11111111111111111111111111111111111111";
const VOTE_PROGRAM_ID = "Vote111111111111111111111111111111111111111111";
const BPF_LOADER_IDS = new Set([
  "BPFLoader1111111111111111111111111111111111111",
  "BPFLoader2111111111111111111111111111111111111",
  "BPFLoaderUpgradeab1e11111111111111111111111"
]);
const LAMPORTS_PER_SOL = 1_000_000_000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRateLimitError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes("429") ||
    msg.toLowerCase().includes("too many requests") ||
    msg.toLowerCase().includes("rate limit")
  );
}

async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (isRateLimitError(err) && attempt < retries - 1) {
        await sleep(1000 * Math.pow(2, attempt)); // 1s, 2s, 4s
        continue;
      }
      throw err;
    }
  }
  throw new Error("Max retries exceeded");
}

export class WalletProfileError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "token-account"
      | "program"
      | "stake-account"
      | "vote-account"
      | "unknown-account-type"
      | "not-found"
      | "rpc-error"
  ) {
    super(message);
    this.name = "WalletProfileError";
  }
}

type TokenAccountInfo = {
  mint: string;
  tokenAmount: { uiAmount: number | null };
  delegate?: string;
  delegatedAmount?: { uiAmount: number | null };
};

export function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

export async function fetchWalletProfile(address: string): Promise<WalletProfileFacts> {
  const connection = new Connection(SOLANA_RPC, "confirmed");
  const publicKey = new PublicKey(address);

  const accountInfo = await withRetry(() => connection.getAccountInfo(publicKey)).catch(() => {
    throw new WalletProfileError(
      "Could not reach the Solana network. Check your connection and try again.",
      "rpc-error"
    );
  });

  if (accountInfo !== null) {
    const owner = accountInfo.owner.toBase58();
    const isTokenAccount = owner === SPL_TOKEN_PROGRAM_ID_STR || owner === TOKEN_2022_PROGRAM_ID_STR;

    if (isTokenAccount) {
      throw new WalletProfileError(
        "This address is an SPL token account, not a wallet. Paste the wallet address that owns it instead.",
        "token-account"
      );
    }
    if (BPF_LOADER_IDS.has(owner)) {
      throw new WalletProfileError("This address is an on-chain program, not a wallet.", "program");
    }
    if (owner === STAKE_PROGRAM_ID) {
      throw new WalletProfileError(
        "This address is a stake account, not a wallet. Use your main wallet address.",
        "stake-account"
      );
    }
    if (owner === VOTE_PROGRAM_ID) {
      throw new WalletProfileError("This address is a validator vote account, not a wallet.", "vote-account");
    }
    if (owner !== SYSTEM_PROGRAM_ID) {
      throw new WalletProfileError(
        `This address is owned by an unknown program (${owner}) and cannot be analysed as a wallet.`,
        "unknown-account-type"
      );
    }
  }

  // Cross-check: if getAccountInfo returned null, verify with getBalance.
  // A rate-limited RPC can silently return null for an existing account.
  // If balance > 0, the account clearly exists — the null was unreliable.
  let neverFunded = accountInfo === null;
  let balanceLamports = 0;

  if (neverFunded) {
    const fallbackBalance = await withRetry(() => connection.getBalance(publicKey)).catch(() => null);
    if (fallbackBalance === null) {
      throw new WalletProfileError(
        "The Solana RPC is rate-limiting requests. Wait a few seconds and try again, or configure a private RPC endpoint.",
        "rpc-error"
      );
    }
    if (fallbackBalance > 0) {
      // Account exists but getAccountInfo was unreliable — treat as funded
      neverFunded = false;
      balanceLamports = fallbackBalance;
    }
  } else {
    balanceLamports = await withRetry(() => connection.getBalance(publicKey));
  }

  const tokenResponse = neverFunded
    ? { value: [] }
    : await withRetry(() =>
        connection.getParsedTokenAccountsByOwner(publicKey, {
          programId: new PublicKey(SPL_TOKEN_PROGRAM_ID_STR)
        })
      );

  const signatures = await withRetry(() => connection.getSignaturesForAddress(publicKey, { limit: 50 }));

  const tokenAccounts: WalletTokenAccount[] = (
    tokenResponse as {
      value: {
        pubkey: { toBase58: () => string };
        account: { data: { parsed: { info: TokenAccountInfo } } };
      }[];
    }
  ).value.map((item) => {
    const info = item.account.data.parsed.info as TokenAccountInfo;
    return {
      address: item.pubkey.toBase58(),
      mint: info.mint,
      balance: info.tokenAmount.uiAmount ?? 0,
      delegate: info.delegate ?? undefined,
      delegatedAmount: info.delegatedAmount?.uiAmount ?? undefined
    };
  });

  return {
    address,
    solBalance: balanceLamports / LAMPORTS_PER_SOL,
    tokenAccounts,
    recentTransactionCount: signatures.length,
    neverFunded,
    fetchedAt: new Date().toISOString()
  };
}
