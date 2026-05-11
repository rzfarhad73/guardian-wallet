import { PublicKey } from "@solana/web3.js";
import { SPL_TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from "./constants";

/** Decode raw memo program data to a UTF-8 string. */
export function decodeMemo(data: Uint8Array | Buffer): string {
  try {
    return Buffer.from(data).toString("utf8");
  } catch {
    return "";
  }
}

/**
 * Decode a System Program Transfer instruction.
 * Returns the lamport amount or undefined if the instruction is not a Transfer.
 */
export function decodeSystemTransfer(data: Uint8Array | Buffer): bigint | undefined {
  const buf = Buffer.from(data);
  // instruction index (4 bytes LE) = 2 for Transfer
  if (buf.length >= 12 && buf.readUInt32LE(0) === 2) {
    return buf.readBigUInt64LE(4);
  }
  return undefined;
}

// SPL Token instruction indices (first byte of data)
// 3 = Transfer, 4 = Approve, 12 = TransferChecked, 13 = ApproveChecked (Token-2022),
// 6 = MintTo, 7 = Burn, 8 = CloseAccount, 26 = SetAuthority

/**
 * Decode an SPL Token / Token-2022 instruction into a structured result.
 * Returns null for unrecognised instruction types.
 */
export function decodeSplTokenInstruction(
  data: Uint8Array | Buffer,
  accounts: string[]
):
  | { type: "transfer"; from: string; to: string; amount: string }
  | { type: "approve"; delegate: string; amount: string }
  | { type: "setAuthority"; newAuthority: string; authorityType: string }
  | null {
  const buf = Buffer.from(data);
  if (buf.length === 0) return null;
  const ix = buf[0];

  // Transfer: [3, amount u64 LE] — accounts: [source, destination, authority]
  if (ix === 3 && buf.length >= 9 && accounts.length >= 2) {
    const amount = buf.readBigUInt64LE(1).toString();
    return { type: "transfer", from: accounts[0], to: accounts[1], amount };
  }
  // TransferChecked: [12, amount u64 LE, decimals u8] — accounts: [source, mint, destination, authority]
  if (ix === 12 && buf.length >= 10 && accounts.length >= 3) {
    const amount = buf.readBigUInt64LE(1).toString();
    return { type: "transfer", from: accounts[0], to: accounts[2], amount };
  }
  // Approve: [4, amount u64 LE] — accounts: [tokenAccount, delegate, owner]
  if (ix === 4 && buf.length >= 9 && accounts.length >= 2) {
    const amount = buf.readBigUInt64LE(1).toString();
    return { type: "approve", delegate: accounts[1], amount };
  }
  // ApproveChecked (Token-2022): [13, amount u64 LE, decimals u8] — accounts: [tokenAccount, mint, delegate, owner]
  if (ix === 13 && buf.length >= 10 && accounts.length >= 3) {
    const amount = buf.readBigUInt64LE(1).toString();
    return { type: "approve", delegate: accounts[2], amount };
  }
  // SetAuthority: [26, authorityType u8, hasNewAuthority u8, newAuthority 32 bytes]
  // accounts: [account, currentAuthority]
  if (ix === 26 && buf.length >= 3 && accounts.length >= 1) {
    const authorityTypeIndex = buf[1];
    const authorityTypes = ["MintTokens", "FreezeAccount", "AccountOwner", "CloseAccount"];
    const authorityType = authorityTypes[authorityTypeIndex] ?? `AuthorityType(${authorityTypeIndex})`;
    const hasNewAuthority = buf[2] === 1;
    let newAuthority = "revoked";
    if (hasNewAuthority && buf.length >= 35) {
      try {
        newAuthority = new PublicKey(buf.slice(3, 35)).toBase58();
      } catch {
        newAuthority = buf.slice(3, 35).toString("hex");
      }
    }
    return { type: "setAuthority", newAuthority, authorityType };
  }

  return null;
}

/** Check if a program ID belongs to the SPL token family. */
export function isSplTokenProgram(programId: string): boolean {
  return programId === SPL_TOKEN_PROGRAM_ID || programId === TOKEN_2022_PROGRAM_ID;
}
