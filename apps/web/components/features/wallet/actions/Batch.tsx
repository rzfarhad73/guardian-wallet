"use client";

import { useState } from "react";
import { CheckCircle, Copy, ShieldOff } from "lucide-react";
import type { WalletTokenAccount } from "@/lib/solana/types";
import Button from "@/components/ui/Button";
import { getPhantom } from "./Phantom";

type BatchRevokeState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; transaction: string }
  | { status: "signing" }
  | { status: "signed"; count: number }
  | { status: "error"; message: string };

export default function Batch({ accounts, owner }: { accounts: WalletTokenAccount[]; owner: string }) {
  const [state, setState] = useState<BatchRevokeState>({ status: "idle" });
  const [copied, setCopied] = useState(false);

  async function buildBatchRevoke() {
    setState({ status: "loading" });
    try {
      const res = await fetch("/api/build-revoke-tx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenAccounts: accounts.map((a) => a.address), owner })
      });
      if (!res.ok) {
        const { error } = (await res.json()) as { error: string };
        setState({ status: "error", message: error });
        return;
      }
      const data = (await res.json()) as { transaction: string };
      setState({ status: "ready", transaction: data.transaction });
    } catch {
      setState({ status: "error", message: "Could not build transaction. Check your connection." });
    }
  }

  async function signBatchWithPhantom(base64Tx: string) {
    const phantom = getPhantom();
    if (!phantom) {
      setState({ status: "error", message: "Phantom not found. Install the Phantom extension and refresh." });
      return;
    }
    setState({ status: "signing" });
    try {
      if (!phantom.publicKey) await phantom.connect();
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
      setState({ status: "signed", count: accounts.length });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("User rejected") || msg.includes("4001")) {
        setState({ status: "ready", transaction: base64Tx });
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

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
      <p className="text-foreground text-xs font-medium">Revoke all {accounts.length} delegates at once</p>
      <p className="text-muted mt-0.5 text-xs">One transaction — fewer network fees.</p>

      {state.status === "idle" && (
        <Button size="sm" variant="secondary" className="mt-3" icon={ShieldOff} onClick={buildBatchRevoke}>
          Revoke all delegates
        </Button>
      )}

      {state.status === "loading" && <p className="text-muted mt-3 text-xs">Building transaction…</p>}

      {state.status === "ready" && (
        <div className="mt-3 space-y-2">
          <p className="text-foreground text-xs font-medium">
            Guardian prepared this transaction. Review it, then sign if you agree.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => signBatchWithPhantom(state.transaction)}>
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
          <p className="text-safe-fg text-xs font-medium">
            {state.count} delegate{state.count !== 1 ? "s" : ""} revoked successfully.
          </p>
        </div>
      )}

      {state.status === "error" && <p className="text-danger mt-3 text-xs">{state.message}</p>}
    </div>
  );
}
