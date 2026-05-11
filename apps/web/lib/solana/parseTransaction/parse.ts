import { Connection, Transaction, VersionedTransaction } from "@solana/web3.js";
import bs58 from "bs58";
import type { ParsedTransactionFacts } from "../types";
import { SOLANA_RPC } from "../rpc";
import { buildFacts } from "./buildFacts";

/** Runtime type guard — narrows unknown JSON to ParsedTransactionFacts. */
export function isParsedTransactionFacts(input: unknown): input is ParsedTransactionFacts {
  return Boolean(
    input &&
    typeof input === "object" &&
    Array.isArray((input as ParsedTransactionFacts).programs) &&
    Array.isArray((input as ParsedTransactionFacts).instructions)
  );
}

/**
 * Accepts either a raw base64 string or an already-parsed facts object.
 * Throws descriptive errors for common wrong inputs (Ethereum addresses,
 * on-chain signatures, wallet addresses, Bitcoin bech32, etc.).
 */
export function parseTransactionInput(input: string | ParsedTransactionFacts): ParsedTransactionFacts {
  if (isParsedTransactionFacts(input)) {
    return input;
  }

  const trimmed = typeof input === "string" ? input.trim() : "";

  if (!trimmed) {
    throw new Error("Paste a base64 serialized transaction or choose a sample transaction.");
  }

  // Ethereum address: 0x followed by 40 hex chars
  if (/^0x[0-9a-fA-F]{40}$/.test(trimmed)) {
    throw new Error(
      "That looks like an Ethereum address. Guardian Wallet Firewall only supports Solana transactions. Paste a base64 serialized Solana transaction."
    );
  }

  // Solana on-chain signature: exactly 87-88 base58 chars
  if (/^[1-9A-HJ-NP-Za-km-z]{87,88}$/.test(trimmed)) {
    throw new Error(
      "That looks like a Solana transaction signature. Use the signature lookup field to fetch it on-chain, or paste the raw base64 transaction data."
    );
  }

  // Solana wallet/token address: 32-44 base58 chars (also catches short Bitcoin base58 addresses)
  if (/^[1-9A-HJ-NP-Za-km-z]{25,44}$/.test(trimmed)) {
    throw new Error(
      "That looks like a wallet or token address, not a transaction. Paste a base64 serialized Solana transaction."
    );
  }

  // Bitcoin bech32 address (bc1..., tb1...)
  if (/^(bc1|tb1|bcrt1)[a-z0-9]{6,87}$/i.test(trimmed)) {
    throw new Error(
      "That looks like a Bitcoin address. Guardian Wallet Firewall only supports Solana transactions. Paste a base64 serialized Solana transaction."
    );
  }

  try {
    return parseBase64Transaction(trimmed);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("Reached end of buffer") || msg.includes("RangeError") || msg.includes("Invalid")) {
      throw new Error(
        "Could not decode the input as a Solana transaction. Make sure you paste a base64 serialized Solana transaction."
      );
    }
    throw err;
  }
}

/** Deserialize a base64-encoded transaction (versioned or legacy) into parsed facts. */
export function parseBase64Transaction(base64: string): ParsedTransactionFacts {
  if (base64.length > 50_000) throw new Error("Transaction data too large.");
  const bytes = Buffer.from(base64, "base64");

  try {
    const versioned = VersionedTransaction.deserialize(bytes);
    const keys = versioned.message.staticAccountKeys.map((key) => key.toBase58());
    const signaturesRequired = versioned.message.header.numRequiredSignatures;
    const signerAddresses = keys.slice(0, signaturesRequired);
    const feePayer = keys[0];
    const rawInstructions = versioned.message.compiledInstructions.map(
      (ix: { programIdIndex: number; accountKeyIndexes: number[]; data: Uint8Array }) => ({
        programId: keys[ix.programIdIndex] ?? "Unknown",
        accounts: ix.accountKeyIndexes.map((i) => keys[i] ?? "Unknown"),
        data: ix.data
      })
    );
    return buildFacts(keys, rawInstructions, signaturesRequired, signerAddresses, feePayer);
  } catch {
    const legacy = Transaction.from(bytes);
    const keys = legacy.instructions.flatMap((instruction) => [
      instruction.programId.toBase58(),
      ...instruction.keys.map((key) => key.pubkey.toBase58())
    ]);
    const signerAddresses = legacy.signatures.map((sig) => sig.publicKey.toBase58());
    const feePayer = legacy.feePayer?.toBase58() ?? signerAddresses[0];
    const signaturesRequired = signerAddresses.length || undefined;
    const rawInstructions = legacy.instructions.map((instruction) => ({
      programId: instruction.programId.toBase58(),
      accounts: instruction.keys.map((key) => key.pubkey.toBase58()),
      data: instruction.data
    }));
    return buildFacts(keys, rawInstructions, signaturesRequired, signerAddresses, feePayer);
  }
}

/** Fetch a confirmed transaction from the Solana RPC by its base58 signature. */
export async function fetchTransactionBySignature(signature: string): Promise<ParsedTransactionFacts> {
  const connection = new Connection(SOLANA_RPC, "confirmed");
  const tx = await connection.getTransaction(signature, {
    maxSupportedTransactionVersion: 0
  });
  if (!tx) {
    throw new Error(`Transaction ${signature} not found on-chain (checked ${SOLANA_RPC}).`);
  }

  const message = tx.transaction.message;
  const isVersioned = "staticAccountKeys" in message;

  if (isVersioned) {
    const keys = message.staticAccountKeys.map((k: { toBase58(): string }) => k.toBase58());
    const signaturesRequired = message.header.numRequiredSignatures;
    const signerAddresses = keys.slice(0, signaturesRequired);
    const feePayer = keys[0];
    const rawInstructions = message.compiledInstructions.map(
      (ix: { programIdIndex: number; accountKeyIndexes: number[]; data: Uint8Array }) => ({
        programId: keys[ix.programIdIndex] ?? "Unknown",
        accounts: ix.accountKeyIndexes.map((i: number) => keys[i] ?? "Unknown"),
        data: ix.data
      })
    );
    return buildFacts(keys, rawInstructions, signaturesRequired, signerAddresses, feePayer);
  }

  // Legacy transaction path
  const legacyTx = tx.transaction as unknown as {
    message: {
      accountKeys: Array<{ toBase58(): string }>;
      instructions: Array<{ programIdIndex: number; accounts: number[]; data: string }>;
    };
    signatures: string[];
  };
  const keys = legacyTx.message.accountKeys.map((k) => k.toBase58());
  const signerAddresses = tx.transaction.signatures.map((_, i) => keys[i]).filter(Boolean);
  const feePayer = keys[0];
  const rawInstructions = legacyTx.message.instructions.map(
    (ix: { programIdIndex: number; accounts: number[]; data: string }) => ({
      programId: keys[ix.programIdIndex] ?? "Unknown",
      accounts: ix.accounts.map((i) => keys[i] ?? "Unknown"),
      data: Buffer.from(bs58.decode(ix.data))
    })
  );
  return buildFacts(keys, rawInstructions, signerAddresses.length || undefined, signerAddresses, feePayer);
}
