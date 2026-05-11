import type { ParsedTransactionFacts } from "@/lib/solana/types";
import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";

export default function ResultsFacts({
  facts,
  loading
}: {
  facts?: ParsedTransactionFacts;
  loading?: boolean;
}) {
  return (
    <Card>
      <h3 className="text-foreground text-lg font-semibold">Technical facts</h3>
      {loading ? (
        <div className="text-foreground mt-4 space-y-4 text-sm">
          <div>
            <p className="text-foreground font-medium">Programs involved</p>
            <ul className="mt-2 space-y-2">
              {[0, 1, 2].map((i) => (
                <li key={i}>
                  <Skeleton className="h-4 w-40" />
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-foreground font-medium">Summary</p>
            <ul className="mt-2 space-y-2 pl-5">
              {[0, 1, 2].map((i) => (
                <li key={i} className="list-none">
                  <Skeleton className="h-4 w-40" />
                </li>
              ))}
            </ul>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i}>
                <Skeleton className="h-4 w-40" />
              </div>
            ))}
          </div>
        </div>
      ) : facts ? (
        <div className="text-foreground mt-4 space-y-4 text-sm">
          <div>
            <p className="text-foreground font-medium">Programs involved</p>
            <ul className="mt-2 space-y-1">
              {facts.programs.map((program) => (
                <li key={program.programId}>
                  {program.label ?? "Unknown program"}:{" "}
                  <span className="break-all font-mono text-xs">{program.programId}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-foreground font-medium">Summary</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {facts.summaryFacts.map((fact) => (
                <li key={fact}>{fact}</li>
              ))}
            </ul>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <p>Signers: {facts.signerAddresses.length || "Unknown"}</p>
            <p>Transfers: {facts.transfers.length}</p>
            <p>Approvals: {facts.approvals.length}</p>
            <p>Authority changes: {facts.authorityChanges.length}</p>
          </div>
        </div>
      ) : (
        <div className="mt-3">
          <p className="text-muted text-sm">No transaction decoded yet.</p>
          <p className="text-muted mt-1 text-xs">
            Paste a base64 transaction or Solana signature above to see decoded programs, transfers, and
            approvals.
          </p>
        </div>
      )}
    </Card>
  );
}
