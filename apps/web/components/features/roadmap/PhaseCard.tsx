import { CheckCircle2 } from "lucide-react";
import Card from "@/components/ui/Card";
import { STATUS_MAP } from "./statusMap";
import type { Phase } from "./types";

interface PhaseCardProps {
  phase: Phase;
  isLast?: boolean;
}

export default function PhaseCard({ phase, isLast }: PhaseCardProps) {
  const meta = STATUS_MAP[phase.status];
  const StatusIcon = meta.icon;

  return (
    <div className="relative flex gap-5">
      <div className="relative z-10 mt-1 hidden shrink-0 md:flex md:w-10 md:flex-col md:items-center">
        <div className={`border-border h-4 w-4 rounded-full border-2 ${meta.dotClass}`} />
        {!isLast && <div className={`mt-1 w-0.5 flex-1 ${meta.dotClass} opacity-40`} />}
      </div>

      <Card className="flex-1">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
          <div>
            <span className="text-muted text-xs font-semibold uppercase tracking-widest">{phase.label}</span>
            <h3 className="text-foreground mt-0.5 text-xl font-bold">{phase.headline}</h3>
          </div>

          <span
            className={`inline-flex w-fit items-center gap-1.5 rounded-full border border-current px-3 py-1 text-xs font-semibold ${meta.className}`}
          >
            <StatusIcon size={12} />
            {meta.label}
          </span>
        </div>

        <ul className="mt-4 space-y-2">
          {phase.milestones.map((milestone) => (
            <li key={milestone.title} className="flex items-start gap-2.5">
              {milestone.done ? (
                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-green-600 dark:text-green-400" />
              ) : (
                <div className="bg-border mt-1.5 h-2 w-2 shrink-0 rounded-full" />
              )}
              <span className={`text-sm leading-6 ${milestone.done ? "text-foreground" : "text-muted"}`}>
                {milestone.title}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
