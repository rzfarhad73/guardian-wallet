import type { ScamPatternMatch } from "@/lib/qvac/types";
import Card from "@/components/ui/Card";
import QvacBadge from "@/components/ui/QvacBadge";

export default function Rag({
  matches = [],
  mode,
  loading
}: {
  matches?: ScamPatternMatch[];
  mode?: string;
  loading?: boolean;
}) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-foreground text-base font-semibold sm:text-lg">Matched local scam patterns</h3>
        {mode ? (
          <QvacBadge active={mode === "qvac"} activeLabel="QVAC Embeddings: Active" inactiveLabel="Mock AI" />
        ) : null}
      </div>
      {loading ? (
        <div className="mt-4 animate-pulse space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="border-border space-y-2 rounded-md border p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="bg-border h-3 w-32 rounded" />
                <div className="bg-border h-3 w-10 rounded" />
              </div>
              <div className="bg-border h-3 w-full rounded" />
              <div className="bg-border h-3 w-4/5 rounded" />
            </div>
          ))}
        </div>
      ) : matches.length ? (
        <ul className="mt-4 space-y-3">
          {matches.map((match) => (
            <li key={match.id} className="border-border bg-surface rounded-md border p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-foreground font-medium">{match.title}</p>
                <span className="text-muted text-xs font-semibold">{match.similarity.toFixed(3)}</span>
              </div>
              <p className="text-muted mt-2 text-sm">{match.text}</p>
            </li>
          ))}
        </ul>
      ) : mode ? (
        <p className="text-muted mt-3 text-sm">No scam patterns matched above the confidence threshold.</p>
      ) : (
        <div className="mt-3">
          <p className="text-muted text-sm">No patterns matched yet.</p>
          <p className="text-muted mt-1 text-xs">
            Upload a screenshot or paste text to run local vector search against the scam-pattern knowledge
            base.
          </p>
        </div>
      )}
    </Card>
  );
}
