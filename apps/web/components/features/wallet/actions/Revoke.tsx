"use client";

import { useState } from "react";
import { CheckCircle, Copy, ShieldOff } from "lucide-react";
import type { WalletTokenAccount } from "@/lib/solana/types";
import Button from "@/components/ui/Button";
import { getPhantom } from "./Phantom";

type RevokeState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; transaction: string; tokenAccount: string }
  | { status: "signing" }
  | { status: "signed" }
  | { status: "error"; message: string };

export default function Revoke({ account, owner }: { account: WalletTokenAccount; owner: string }) {
  const [state, setState] = useState<RevokeState>({ status: "idle" });
  const [copied, setCopied] = useState(false);

  async function buildRevoke() {
    setState({ status: "loading" });
    try {
      const res = await fetch("/api/build-revoke-tx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenAccount: account.address, owner })
      });
      if (!res.ok) {
        const { error } = (await res.json()) as { error: string };
        setState({ status: "error", message: error });
        return;
      }
      const data = (await res.json()) as { transaction: string; tokenAccount: string };
      setState({ status: "ready", transaction: data.transaction, tokenAccount: data.tokenAccount });
    } catch {
      setState({ status: "error", message: "Could not build transaction. Check your connection." });
    }
  }

  async function signWithPhantom(base64Tx: string) {
    const phantom = getPhantom();
    if (!phantom) return;
    setState({ status: "signing" });
    try {
      // Connect if not already connected.
      if (!phantom.publicKey) {
        await phantom.connect();
      }
      const connectedAddress = phantom.publicKey?.toBase58();
      if (connectedAddress !== owner) {
        setState({
          status: "error",
          message: `Connect the wallet that owns this address in Phantom. Connected: ${connectedAddress?.slice(0, 8) ?? "none"}…`
        });
        return;
      }
      const bytes = Uint8Array.from(atob(base64Tx), (c) => c.charCodeAt(0));
      const { Transaction } = await import("@solana/web3.js");
      const transaction = Transaction.from(bytes);
      await phantom.signAndSendTransaction(transaction);
      setState({ status: "signed" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // User dismissed the Phantom popup — not an error worth alarming about.
      if (msg.includes("User rejected") || msg.includes("4001")) {
        setState({ status: "ready", transaction: base64Tx, tokenAccount: account.address });
        return;
      }
      setState({ status: "error", message: msg });
    }
  }

  async function copyBase64(tx: string) {
    await navigator.clipboard.writeText(tx);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function signWithPhantomClick(base64Tx: string) {
    // Re-check at click time in case Phantom injected after initial render.
    const p = getPhantom();
    if (!p) {
      setState({ status: "error", message: "Phantom not found. Install the Phantom extension and refresh." });
      return;
    }
    return signWithPhantom(base64Tx);
  }

  return (
    <div className="warn-box rounded-lg border p-4">
      <p className="text-foreground text-xs font-medium">Token account delegate</p>
      <p className="text-warn-fg mt-0.5 truncate font-mono text-xs">{account.mint}</p>
      <p className="text-warn-fg truncate font-mono text-xs">Delegate: {account.delegate}</p>

      {state.status === "idle" && (
        <Button size="sm" variant="secondary" className="mt-3" icon={ShieldOff} onClick={buildRevoke}>
          Revoke delegate
        </Button>
      )}

      {state.status === "loading" && <p className="text-muted mt-3 text-xs">Building transaction…</p>}

      {state.status === "ready" && (
        <div className="mt-3 space-y-2">
          <p className="text-foreground text-xs font-medium">
            Guardian prepared this transaction. Review it, then sign if you agree.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => signWithPhantomClick(state.transaction)}>
              Sign with Phantom
            </Button>
            <Button size="sm" variant="secondary" icon={Copy} onClick={() => copyBase64(state.transaction)}>
              {copied ? "Copied" : "Copy unsigned tx"}
            </Button>
          </div>
        </div>
      )}

      {state.status === "signing" && <p className="text-muted mt-3 text-xs">Waiting for Phantom…</p>}

      {state.status === "signed" && (
        <div className="mt-3 flex items-center gap-1.5">
          <CheckCircle size={14} className="text-safe-fg shrink-0" />
          <p className="text-safe-fg text-xs font-medium">Delegate revoked successfully.</p>
        </div>
      )}

      {state.status === "error" && <p className="text-danger mt-3 text-xs">{state.message}</p>}
    </div>
  );
}
