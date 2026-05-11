import { classifyProgram } from "../classifyInstruction";
import type {
  ApprovalChange,
  AssetTransfer,
  AuthorityChange,
  ParsedInstruction,
  ParsedTransactionFacts
} from "../types";
import {
  LAMPORTS_PER_SOL,
  MEMO_PROGRAM_ID,
  SYSTEM_PROGRAM_ID,
  SPL_TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID
} from "./constants";
import { decodeMemo, decodeSystemTransfer, decodeSplTokenInstruction } from "./decoders";

/**
 * Assemble a ParsedTransactionFacts object from raw instruction data.
 * This is the core normalisation step: raw bytes + account keys → structured facts.
 */
export function buildFacts(
  keys: string[],
  rawInstructions: Array<{ programId: string; accounts: string[]; data: Uint8Array | Buffer }>,
  signaturesRequired: number | undefined,
  signerAddresses: string[],
  feePayer: string | undefined
): ParsedTransactionFacts {
  const instructions: ParsedInstruction[] = [];
  const transfers: AssetTransfer[] = [];
  const approvals: ApprovalChange[] = [];
  const authorityChanges: AuthorityChange[] = [];
  let memoText: string | undefined;

  rawInstructions.forEach((ix, index) => {
    const program = classifyProgram(ix.programId);
    let description = program.known
      ? `Instruction ${index + 1} calls ${program.label}.`
      : "Unknown program. This does not automatically mean malicious, but it requires caution.";

    if (ix.programId === MEMO_PROGRAM_ID) {
      const text = decodeMemo(ix.data);
      if (text) {
        memoText = (memoText ? `${memoText} | ` : "") + text;
        description = `Memo: "${text}"`;
      }
    }

    if (ix.programId === SYSTEM_PROGRAM_ID && ix.accounts.length >= 2) {
      const lamports = decodeSystemTransfer(ix.data);
      if (lamports !== undefined) {
        const sol = (Number(lamports) / LAMPORTS_PER_SOL).toString();
        transfers.push({
          assetType: "SOL",
          amount: sol,
          from: ix.accounts[0],
          to: ix.accounts[1]
        });
        description = `Transfer ${sol} SOL from ${ix.accounts[0]} to ${ix.accounts[1]}`;
      }
    }

    if (ix.programId === SPL_TOKEN_PROGRAM_ID || ix.programId === TOKEN_2022_PROGRAM_ID) {
      const decoded = decodeSplTokenInstruction(ix.data, ix.accounts);
      if (decoded?.type === "transfer") {
        transfers.push({
          assetType: "SPL",
          amount: decoded.amount,
          from: decoded.from,
          to: decoded.to
        });
        description = `Token transfer: ${decoded.amount} tokens from ${decoded.from} to ${decoded.to}`;
      } else if (decoded?.type === "approve") {
        approvals.push({
          tokenAccount: ix.accounts[0],
          delegate: decoded.delegate,
          amount: decoded.amount
        });
        description = `Token delegate approval: grants ${decoded.delegate} permission to move up to ${decoded.amount} tokens from ${ix.accounts[0]}`;
      } else if (decoded?.type === "setAuthority") {
        authorityChanges.push({
          account: ix.accounts[0],
          newAuthority: decoded.newAuthority,
          authorityType: decoded.authorityType
        });
        description = `Authority change (${decoded.authorityType}): new authority set to ${decoded.newAuthority}`;
      }
    }

    instructions.push({
      programId: ix.programId,
      programLabel: program.label,
      type: program.known ? "compiledInstruction" : "unknown",
      accounts: ix.accounts,
      description
    });
  });

  const programIds = [...new Set(instructions.map((ix) => ix.programId))];
  const programs = programIds.map(classifyProgram);
  const unknownInstructions = instructions.filter((ix) => !classifyProgram(ix.programId).known);
  const summaryFacts = [
    `Requires ${signaturesRequired ?? signerAddresses.length} signature(s)`,
    `Calls ${programs.length} program(s)`,
    unknownInstructions.length
      ? "Includes unknown program instructions"
      : "All detected programs are in the known registry"
  ];
  if (memoText) summaryFacts.push(`Memo: "${memoText}"`);

  return {
    signaturesRequired,
    signerAddresses,
    feePayer,
    programs,
    instructions,
    transfers,
    approvals,
    authorityChanges,
    unknownInstructions,
    summaryFacts,
    memoText
  };
}
