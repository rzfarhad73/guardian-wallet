import type { RiskFinding } from "@/lib/solana/types";
import Button from "@/components/ui/Button";
import ExportReport from "@/components/ui/ExportReport";
import Explanation from "@/components/features/risk/Explanation";
import Reasons from "@/components/features/risk/Reasons";
import Score from "@/components/features/risk/Score";
import Actions from "@/components/features/wallet/actions";
import ResultsIncident from "@/components/features/wallet/ResultsIncident";
import type { WalletResult } from "./types";

type Props = {
  result?: WalletResult;
  loading: boolean;
  onOpenTransaction?: () => void;
};

export default function Results({ result, loading, onOpenTransaction }: Props) {
  return (
    <section className="min-w-0 space-y-6">
      <Score assessment={result?.assessment} loading={loading} />
      <Reasons findings={(result?.assessment.findings ?? []) as RiskFinding[]} loading={loading} />
      <Explanation
        explanation={result?.explanation}
        mode={result?.mode}
        title="Wallet risk summary"
        loading={loading}
      />
      {result ? <Actions facts={result.facts} loading={loading} /> : null}
      {result?.facts ? <ResultsIncident facts={result.facts} /> : null}
      {result && (
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
          <ExportReport
            data={{
              address: result.facts.address,
              facts: result.facts,
              assessment: result.assessment,
              explanation: result.explanation
            }}
            filename="guardian-wallet-report"
          />
          {onOpenTransaction && (
            <Button type="button" variant="secondary" size="sm" onClick={onOpenTransaction}>
              Analyze a transaction from this wallet →
            </Button>
          )}
        </div>
      )}
    </section>
  );
}
