import Card from "@/components/ui/Card";
import Tools from "./Tools";
import Pipeline from "./Pipeline";
import RiskPrivacy from "./RiskPrivacy";
import Limitations from "./Limitations";

export default function HowItWorks() {
  return (
    <div className="space-y-12">
      <div className="max-w-3xl">
        <h2 className="text-foreground text-3xl font-bold md:text-4xl">How Guardian works</h2>
        <p className="text-muted mt-4 text-base leading-7 md:text-lg">
          Guardian analyses Solana transactions, screenshots, and wallet addresses using a local-first
          pipeline. Your data is never sent to a cloud AI. QVAC runs the AI work on your machine; optional
          on-chain lookups use Solana RPC.
        </p>
      </div>

      <Tools />
      <Pipeline />
      <RiskPrivacy />
      <Limitations />

      <Card>
        <p className="text-muted text-base leading-7">
          <span className="text-foreground font-semibold">
            Guardian is a safety assistant, not a guarantee.
          </span>{" "}
          Deterministic rules and local AI can identify known patterns and high-risk signals, but novel attack
          vectors may not be detected. Always verify transactions independently. Never share your seed phrase
          or private key with any tool, person, or website, including Guardian.
        </p>
      </Card>
    </div>
  );
}
