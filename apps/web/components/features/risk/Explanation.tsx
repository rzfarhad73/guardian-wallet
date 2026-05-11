import { CONFIDENCE, type ConfidenceLevel, type GuardianExplanation } from "@/lib/solana/types";
import Card from "@/components/ui/Card";
import QvacBadge from "@/components/ui/QvacBadge";
import Skeleton from "@/components/ui/Skeleton";

const CONFIDENCE_BADGE: Record<ConfidenceLevel, string> = {
  [CONFIDENCE.High]: "badge-low",
  [CONFIDENCE.Medium]: "badge-medium",
  [CONFIDENCE.Low]: "badge-neutral"
};

export default function Explanation({
  explanation,
  mode,
  title = "AI risk explanation",
  loading
}: {
  explanation?: GuardianExplanation;
  mode?: string;
  title?: string;
  loading?: boolean;
}) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-foreground text-lg font-semibold">{title}</h3>
        {mode ? (
          <QvacBadge active={mode === "qvac"} activeLabel="QVAC LLM: Active" inactiveLabel="Mock AI" />
        ) : null}
      </div>
      {loading ? (
        <div className="mt-4 space-y-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      ) : explanation ? (
        <div className="text-foreground mt-4 space-y-3 text-sm">
          <p className="text-foreground text-base font-medium">
            {explanation.summary || "No summary available."}
          </p>
          <p>{explanation.plainEnglishExplanation || "No explanation available."}</p>
          <div className="border-border bg-surface-raised mt-4 rounded-lg border px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-muted text-xs font-medium">Suggested action</p>
              <span
                className={`shrink-0 rounded border px-2 py-0.5 text-xs font-semibold ${CONFIDENCE_BADGE[explanation.confidence]}`}
              >
                {explanation.confidence} confidence
              </span>
            </div>
            <p className="text-foreground mt-2 font-medium">{explanation.suggestedAction}</p>
          </div>
        </div>
      ) : (
        <p className="text-muted mt-3 text-sm">QVAC local LLM explanation will appear here after analysis.</p>
      )}
    </Card>
  );
}
