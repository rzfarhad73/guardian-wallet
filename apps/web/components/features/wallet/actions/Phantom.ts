export type PhantomProvider = {
  isPhantom: boolean;
  publicKey: { toBase58(): string } | null;
  connect(): Promise<{ publicKey: { toBase58(): string } }>;
  signAndSendTransaction: (tx: unknown) => Promise<{ signature: string }>;
};

export function getPhantom(): PhantomProvider | null {
  const win = window as unknown as { solana?: PhantomProvider };
  if (win.solana?.isPhantom) return win.solana;
  return null;
}
