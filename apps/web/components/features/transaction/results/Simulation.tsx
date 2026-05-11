import type { SimulationResult } from "@/lib/solana/types";

type Props = {
  simulation: SimulationResult;
};

function shorten(value?: string) {
  if (!value) return "unknown";
  return value.length <= 16 ? value : `${value.slice(0, 6)}...${value.slice(-6)}`;
}

function directionPrefix(direction: SimulationResult["assetChanges"][number]["direction"]) {
  if (direction === "out") return "-";
  if (direction === "in") return "+";
  if (direction === "internal") return "=";
  return "?";
}

export default function ResultsSimulation({ simulation }: Props) {
  const hasBalanceChanges = simulation.balanceChanges.length > 0;
  const hasAssetChanges = simulation.assetChanges.length > 0;
  const hasPermissionChanges = simulation.permissionChanges.length > 0;

  return (
    <section className="border-border bg-card rounded-md border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-foreground text-sm font-semibold">Parsed + RPC Simulation Effect</h3>
          <p className="text-muted mt-1 text-xs">
            RPC simulation checks execution status; asset and permission effects are decoded locally from the
            transaction instructions.
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            simulation.wouldSucceed
              ? "border border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
              : "border border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
          }`}
        >
          {simulation.wouldSucceed ? "Would succeed" : "Would fail"}
        </span>
      </div>

      {!simulation.wouldSucceed && simulation.error && (
        <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
          {simulation.error}
        </p>
      )}

      <div className="mt-4">
        <p className="text-muted text-xs font-semibold uppercase tracking-wide">Simulated balance diff</p>
        {!simulation.wouldSucceed ? (
          <p className="text-muted mt-2 text-xs">
            Not shown — balance deltas from a failed simulation are not meaningful.
          </p>
        ) : hasBalanceChanges ? (
          <ul className="mt-2 space-y-2">
            {simulation.balanceChanges.map((change, index) => (
              <li key={`${change.account}-${index}`} className="border-border rounded-md border px-3 py-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-foreground break-words text-sm">{change.description}</p>
                    <p className="text-muted mt-1 text-xs">
                      {change.assetType}
                      {change.mint ? ` mint ${shorten(change.mint)}` : ""} on {shorten(change.account)}
                    </p>
                  </div>
                  <span className="border-border rounded-full border px-2 py-1 font-mono text-xs">
                    {change.change}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted mt-2 text-xs">
            No pre/post balance delta returned by RPC simulation for tracked accounts.
          </p>
        )}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div>
          <p className="text-muted text-xs font-semibold uppercase tracking-wide">Asset movement</p>
          {hasAssetChanges ? (
            <ul className="mt-2 space-y-2">
              {simulation.assetChanges.map((change, index) => (
                <li
                  key={`${change.description}-${index}`}
                  className="border-border rounded-md border px-3 py-2"
                >
                  <div className="flex items-start gap-2 text-sm">
                    <span className="font-mono font-semibold">{directionPrefix(change.direction)}</span>
                    <div className="min-w-0">
                      <p className="text-foreground break-words text-sm">{change.description}</p>
                      {change.mint && <p className="text-muted mt-1 text-xs">Mint: {shorten(change.mint)}</p>}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted mt-2 text-xs">No parsed asset movement detected.</p>
          )}
        </div>

        <div>
          <p className="text-muted text-xs font-semibold uppercase tracking-wide">Permission changes</p>
          {hasPermissionChanges ? (
            <ul className="mt-2 space-y-2">
              {simulation.permissionChanges.map((change, index) => (
                <li
                  key={`${change.description}-${index}`}
                  className="border-border rounded-md border px-3 py-2"
                >
                  <p className="text-foreground break-words text-sm">{change.description}</p>
                  {change.delegate && (
                    <p className="text-muted mt-1 text-xs">Delegate: {shorten(change.delegate)}</p>
                  )}
                  {change.newAuthority && (
                    <p className="text-muted mt-1 text-xs">New authority: {shorten(change.newAuthority)}</p>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted mt-2 text-xs">
              No parsed delegate approval or authority change detected.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
