import type { RiskFinding } from "@/lib/solana/types";
import ExportReport from "@/components/ui/ExportReport";
import Explanation from "@/components/features/risk/Explanation";
import Reasons from "@/components/features/risk/Reasons";
import Score from "@/components/features/risk/Score";
import ResultsFacts from "./Facts";
import ResultsMatch from "./Match";
import ResultsSimulation from "./Simulation";
import { CONTEXT_OPTIONS } from "../data";
import type { TransactionResult } from "../types";

type Props = {
  result?: TransactionResult;
  loading: boolean;
};

export default function Results({ result, loading }: Props) {
  return (
    <section className="min-w-0 space-y-6">
      {result?.intentCheck && <ResultsMatch intentCheck={result.intentCheck} />}
      {result?.context && result.context !== "pre-sign" && (
        <div className="accent-box rounded-md border px-4 py-2 text-xs">
          Analyzed as:{" "}
          <span className="font-semibold">
            {CONTEXT_OPTIONS.find((o) => o.value === result.context)?.label ?? result.context}
          </span>{" "}
          &mdash; {CONTEXT_OPTIONS.find((o) => o.value === result.context)?.description}
        </div>
      )}
      <Score assessment={result?.assessment} loading={loading} />
      {result?.simulationResult && <ResultsSimulation simulation={result.simulationResult} />}
      <ResultsFacts facts={result?.facts} loading={loading} />
      <Reasons findings={(result?.assessment.findings ?? []) as RiskFinding[]} loading={loading} />
      <Explanation
        explanation={result?.explanation}
        mode={result?.mode}
        title="What this transaction does"
        loading={loading}
      />
      {result && (
        <ExportReport
          data={{
            mode: result.mode,
            context: result.context,
            intentCheck: result.intentCheck,
            facts: result.facts,
            simulationResult: result.simulationResult,
            assessment: result.assessment,
            explanation: result.explanation
          }}
          filename="guardian-transaction-report"
        />
      )}
    </section>
  );
}
