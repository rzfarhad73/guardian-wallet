"use client";

import type { IntentCheck, IntentVerdict } from "@/lib/solana/types";
import Card from "@/components/ui/Card";

const VERDICT_CONFIG: Record<
  IntentVerdict,
  { label: string; rowClass: string; labelClass: string; reasonClass: string }
> = {
  match: {
    label: "Match",
    rowClass: "border-[var(--badge-low-border)] bg-[var(--badge-low-bg)]",
    labelClass: "text-safe-fg",
    reasonClass: "text-safe-fg"
  },
  unclear: {
    label: "Unclear",
    rowClass: "border-border bg-surface-raised",
    labelClass: "text-muted",
    reasonClass: "text-muted"
  },
  partial_mismatch: {
    label: "Partial mismatch",
    rowClass: "border-[var(--badge-medium-border)] bg-[var(--badge-medium-bg)]",
    labelClass: "text-[var(--badge-medium-fg)]",
    reasonClass: "text-[var(--badge-medium-fg)]"
  },
  critical_mismatch: {
    label: "Critical mismatch",
    rowClass: "border-[var(--color-warn-border)] bg-[var(--color-warn-bg)]",
    labelClass: "text-warn-label",
    reasonClass: "text-warn-fg"
  }
};

export default function Match({ intentCheck }: { intentCheck: IntentCheck }) {
  const cfg = VERDICT_CONFIG[intentCheck.verdict];

  return (
    <Card>
      <h3 className="text-foreground text-sm font-semibold">Intent check</h3>
      <div className={`mt-3 rounded-md border p-3 ${cfg.rowClass}`}>
        <div className="space-y-1.5 text-xs">
          <div className="flex gap-3">
            <span className="text-muted w-20 shrink-0 font-medium">You said</span>
            <span className="text-foreground min-w-0 break-words">
              &ldquo;{intentCheck.declaredIntent}&rdquo;
            </span>
          </div>
          <div className="flex gap-3">
            <span className="text-muted w-20 shrink-0 font-medium">This does</span>
            <span className="text-foreground min-w-0 break-words">{intentCheck.actualEffect}</span>
          </div>
          <div className="flex gap-3">
            <span className="text-muted w-20 shrink-0 font-medium">Verdict</span>
            <span className={`font-semibold ${cfg.labelClass}`}>{cfg.label}</span>
          </div>
        </div>
        {intentCheck.verdict !== "unclear" && (
          <p className={`mt-2 border-t border-inherit pt-2 text-xs ${cfg.reasonClass}`}>
            {intentCheck.reason}
          </p>
        )}
      </div>
    </Card>
  );
}
