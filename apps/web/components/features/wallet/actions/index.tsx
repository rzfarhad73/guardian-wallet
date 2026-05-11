"use client";

import type { WalletProfileFacts } from "@/lib/solana/types";
import Card from "@/components/ui/Card";
import Revoke from "./Revoke";
import Batch from "./Batch";

export default function Actions({ facts, loading }: { facts?: WalletProfileFacts; loading?: boolean }) {
  if (loading || !facts) return null;

  const delegatedAccounts = facts.tokenAccounts.filter((t) => t.delegate);
  if (delegatedAccounts.length === 0) return null;

  return (
    <Card>
      <h3 className="text-foreground text-lg font-semibold">Suggested actions</h3>
      <p className="text-muted mt-2 text-sm">
        Guardian detected active token delegates — the mechanism wallet drainers use to pull tokens without
        your signature. Revoke any delegate you did not intentionally set.
      </p>
      <div className="mt-4 space-y-3">
        {delegatedAccounts.length >= 2 && <Batch accounts={delegatedAccounts} owner={facts.address} />}
        {delegatedAccounts.map((account) => (
          <Revoke key={account.mint} account={account} owner={facts.address} />
        ))}
      </div>
    </Card>
  );
}
