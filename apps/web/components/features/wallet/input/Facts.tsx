import type { WalletProfileFacts } from "@/lib/solana/types";
import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";

export default function Facts({ facts, loading }: { facts?: WalletProfileFacts; loading?: boolean }) {
  const delegatedAccounts = !loading && facts ? facts.tokenAccounts.filter((t) => t.delegate) : [];
  const hasDelegates = delegatedAccounts.length > 0;

  return (
    <Card>
      <h3 className="text-foreground text-lg font-semibold">On-chain facts</h3>
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted">SOL balance</dt>
          <dd className="text-foreground font-medium">
            {loading ? (
              <Skeleton className="h-4 w-16" />
            ) : facts ? (
              `${facts.solBalance.toFixed(4)} SOL`
            ) : null}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">Token accounts</dt>
          <dd className="text-foreground font-medium">
            {loading ? <Skeleton className="h-4 w-16" /> : facts ? facts.tokenAccounts.length : null}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">Active delegates</dt>
          <dd className={`font-medium ${hasDelegates ? "text-warn-fg" : "text-safe-fg"}`}>
            {loading ? <Skeleton className="h-4 w-16" /> : facts ? delegatedAccounts.length : null}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">Recent transactions</dt>
          <dd className="text-foreground font-medium">
            {loading ? <Skeleton className="h-4 w-16" /> : facts ? facts.recentTransactionCount : null}
          </dd>
        </div>
      </dl>

      {hasDelegates ? (
        <div className="mt-4">
          <p className="text-warn-label text-sm font-medium">Delegated token accounts</p>
          <ul className="mt-2 space-y-2">
            {delegatedAccounts.map((t) => (
              <li key={t.mint} className="warn-box rounded-md border p-3 font-mono text-xs">
                <span className="block truncate">Mint: {t.mint}</span>
                <span className="block truncate">Delegate: {t.delegate}</span>
                {t.delegatedAmount != null && <span className="block">Approved: {t.delegatedAmount}</span>}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {facts ? (
        <p className="text-muted mt-4 text-xs">
          Fetched {new Date(facts.fetchedAt).toLocaleTimeString()} from Solana mainnet
        </p>
      ) : null}
    </Card>
  );
}
