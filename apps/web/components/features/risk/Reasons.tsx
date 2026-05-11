import type { RiskFinding } from "@/lib/solana/types";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";

export default function Reasons({ findings = [], loading }: { findings?: RiskFinding[]; loading?: boolean }) {
  return (
    <Card>
      <h3 className="text-foreground text-lg font-semibold">Risk reasons</h3>
      {loading ? (
        <div className="mt-4 space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-surface-hover rounded-md p-3">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="mt-2 h-3 w-full" />
            </div>
          ))}
        </div>
      ) : findings.length ? (
        <ul className="mt-4 space-y-3">
          {findings.map((finding) => (
            <li key={finding.id} className="border-border bg-surface overflow-x-auto rounded-md border p-3">
              <div className="flex items-start justify-between gap-3">
                <p className="text-foreground flex-1 font-medium">{finding.title}</p>
                <Badge
                  variant={finding.severity as "critical" | "high" | "medium" | "low"}
                  className="shrink-0"
                >
                  {finding.severity}
                </Badge>
              </div>
              <p className="text-muted mt-2 text-sm">{finding.explanation}</p>
              <p className="text-muted mt-2 font-mono text-xs">{finding.evidence.join(" | ")}</p>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-3">
          <p className="text-muted text-sm">No deterministic findings.</p>
          <p className="text-muted mt-1 text-xs">
            Guardian&apos;s rule engine found no specific risk signals in this input.
          </p>
        </div>
      )}
    </Card>
  );
}
