import { NextResponse } from "next/server";
import { Connection, PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";
import { isValidSolanaAddress } from "@/lib/solana/walletProfile";

export const runtime = "nodejs";

const SOLANA_RPC = process.env.SOLANA_RPC_URL ?? "https://api.mainnet-beta.solana.com";
const SPL_TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const REVOKE_INSTRUCTION_DATA = Buffer.from([5]);
const MAX_REVOKES_PER_TX = 10;

export async function POST(request: Request) {
  let body: { tokenAccount?: string; tokenAccounts?: string[]; owner?: string };
  try {
    body = (await request.json()) as { tokenAccount?: string; tokenAccounts?: string[]; owner?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const owner = body.owner?.trim();
  if (!owner) {
    return NextResponse.json({ error: "owner is required." }, { status: 400 });
  }
  if (!isValidSolanaAddress(owner)) {
    return NextResponse.json({ error: "Invalid Solana address." }, { status: 400 });
  }

  // Accept either a single tokenAccount (backward compat) or tokenAccounts array.
  const rawAccounts: string[] = body.tokenAccounts?.length
    ? body.tokenAccounts
    : body.tokenAccount
      ? [body.tokenAccount]
      : [];

  if (rawAccounts.length === 0) {
    return NextResponse.json({ error: "tokenAccount or tokenAccounts is required." }, { status: 400 });
  }

  const tokenAccounts = rawAccounts.map((a) => a.trim()).slice(0, MAX_REVOKES_PER_TX);
  for (const account of tokenAccounts) {
    if (!isValidSolanaAddress(account)) {
      return NextResponse.json({ error: `Invalid token account address: ${account}` }, { status: 400 });
    }
  }

  const connection = new Connection(SOLANA_RPC, "confirmed");
  let blockhash: string;
  try {
    ({ blockhash } = await connection.getLatestBlockhash("confirmed"));
  } catch {
    return NextResponse.json({ error: "Solana RPC unavailable. Try again shortly." }, { status: 503 });
  }

  const ownerPubkey = new PublicKey(owner);
  const transaction = new Transaction({
    recentBlockhash: blockhash,
    feePayer: ownerPubkey
  });

  for (const account of tokenAccounts) {
    transaction.add(
      new TransactionInstruction({
        programId: SPL_TOKEN_PROGRAM_ID,
        keys: [
          { pubkey: new PublicKey(account), isSigner: false, isWritable: true },
          { pubkey: ownerPubkey, isSigner: true, isWritable: false }
        ],
        data: REVOKE_INSTRUCTION_DATA
      })
    );
  }

  const serialized = transaction.serialize({ requireAllSignatures: false, verifySignatures: false });

  return NextResponse.json({
    transaction: serialized.toString("base64"),
    tokenAccounts,
    owner
  });
}
