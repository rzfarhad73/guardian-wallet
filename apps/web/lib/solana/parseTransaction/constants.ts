/** Well-known Solana program IDs used during transaction decoding. */
export const MEMO_PROGRAM_ID = "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr";
export const SYSTEM_PROGRAM_ID = "11111111111111111111111111111111";
export const SPL_TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
export const TOKEN_2022_PROGRAM_ID = "TokenzQdBNbLqP5VEhdkAS6EPQj8XDPxQhR8Qo9b8r1";

// System Program instruction layout: first 4 bytes = instruction type (LE), type 2 = Transfer
// Transfer layout: [2, 0, 0, 0, lamports (8 bytes LE)]
export const LAMPORTS_PER_SOL = 1_000_000_000;
