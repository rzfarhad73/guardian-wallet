import Card from "@/components/ui/Card";
import PhaseCard from "./PhaseCard";
import { PHASES } from "./data";

export default function Roadmap() {
  return (
    <div className="space-y-12">
      <div>
        <h2 className="text-foreground text-3xl font-bold md:text-4xl">Roadmap</h2>
        <p className="text-muted mt-4 text-base leading-7 md:text-lg">
          Guardian started as a hackathon proof-of-concept and is being built toward a production SDK that any
          Solana wallet can integrate. The consumer PWA shows it works. The SDK is the product.
        </p>
      </div>

      <div className="relative">
        <div className="space-y-4">
          {PHASES.map((phase, i) => (
            <PhaseCard key={phase.phase} phase={phase} isLast={i === PHASES.length - 1} />
          ))}
        </div>
      </div>

      <Card className="border-primary/30 bg-primary/5">
        <p className="text-foreground text-sm leading-7 md:text-base">
          <span className="font-semibold">The long-term vision:</span> any Solana wallet should be able to add
          Guardian&apos;s pre-sign firewall in a weekend. The consumer PWA proves the pipeline works. The SDK
          makes it distributable. QVAC makes it private: the risk engine runs entirely on the user&apos;s
          device, without any cloud dependency, subscription, or API key.
        </p>
      </Card>
    </div>
  );
}
