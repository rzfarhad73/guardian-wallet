import { AlertTriangle, ExternalLink } from "lucide-react";
import type { WalletProfileFacts } from "@/lib/solana/types";
import Card from "@/components/ui/Card";

const STEPS = [
  {
    n: 1,
    text: "Revoke all active delegates using the actions above — this removes the drainer's permission immediately."
  },
  {
    n: 2,
    text: "Move remaining tokens and SOL to a freshly generated wallet that has never been exposed."
  },
  {
    n: 3,
    text: "Review recent transactions on Solana Explorer to identify any unauthorized transfers."
  },
  {
    n: 4,
    text: "Do not reuse this wallet for high-value assets until you understand how the delegate was set."
  }
];

export default function ResultsIncident({ facts }: { facts: WalletProfileFacts }) {
  const hasDelegates = facts.tokenAccounts.some((t) => t.delegate);
  if (!hasDelegates) return null;

  const explorerUrl = `https://explorer.solana.com/address/${facts.address}`;

  return (
    <Card>
      <div className="flex items-start gap-3">
        <AlertTriangle size={18} className="text-critical mt-0.5 shrink-0" />
        <div>
          <h3 className="text-foreground text-base font-semibold">
            If you did not set these delegates, treat this wallet as compromised
          </h3>
          <p className="text-muted mt-1 text-sm">
            Active token delegates are the primary mechanism used by wallet drainers. Follow these steps
            immediately.
          </p>
        </div>
      </div>

      <ol className="mt-4 space-y-3">
        {STEPS.map((step) => (
          <li key={step.n} className="flex items-start gap-3 text-sm">
            <span className="bg-critical/20 text-critical border-critical/50 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold">
              {step.n}
            </span>
            <span className="text-foreground leading-6">{step.text}</span>
          </li>
        ))}
      </ol>

      <a
        href={explorerUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary mt-4 inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
      >
        <ExternalLink size={13} />
        View recent transactions on Solana Explorer
      </a>
    </Card>
  );
}
