import { WifiOff, Lock } from "lucide-react";
import Card from "@/components/ui/Card";
import { RISK_LEVELS, PRIVACY_ROWS } from "./data";

export default function RiskPrivacy() {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card>
        <h3 className="text-foreground text-2xl font-semibold">Risk score levels</h3>
        <p className="text-muted mt-2 text-sm leading-6">
          Score is the sum of all finding impacts, capped at 100. Each finding has a fixed scoreImpact set by
          the rule engine.
        </p>
        <div className="mt-5 space-y-4">
          {RISK_LEVELS.map((r) => (
            <div key={r.label}>
              <div className="flex items-baseline justify-between">
                <span className={`text-base font-bold ${r.color}`}>{r.label}</span>
                <span className="text-muted text-sm">{r.range}</span>
              </div>
              <div className="bg-surface-hover mt-1.5 h-1.5 w-full rounded-full">
                <div className={`h-1.5 rounded-full ${r.bar} ${r.width}`} />
              </div>
              <p className="text-muted mt-1 text-sm">{r.desc}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-2">
          <Lock size={20} className="text-primary" />
          <h3 className="text-foreground text-2xl font-semibold">Privacy model</h3>
        </div>
        <p className="text-muted mt-2 text-sm leading-6">What stays local, and what uses Solana RPC.</p>
        <div className="mt-5 space-y-3">
          {PRIVACY_ROWS.map((row) => (
            <div key={row.label} className="flex items-start gap-3">
              <WifiOff size={14} className="text-safe-fg mt-0.5 shrink-0" />
              <div>
                <span className="text-foreground text-sm font-semibold">{row.label}</span>
                <p className="text-muted text-sm">{row.value}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
