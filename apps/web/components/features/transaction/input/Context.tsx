import Card from "@/components/ui/Card";
import type { ViewerContext } from "@/lib/solana/types";
import { CONTEXT_OPTIONS } from "../data";

type Props = {
  context: ViewerContext;
  onContextChange: (ctx: ViewerContext) => void;
};

export default function InputContext({ context, onContextChange }: Props) {
  const activeOption = CONTEXT_OPTIONS.find((o) => o.value === context);

  return (
    <Card>
      <h2 className="text-foreground text-xl font-semibold">Transaction Analyzer</h2>

      <fieldset className="mt-5">
        <legend className="text-foreground text-sm font-medium">Your relationship to this transaction</legend>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {CONTEXT_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onContextChange(option.value)}
              title={option.description}
              className={`focus-visible:ring-primary rounded-md border px-3 py-2 text-left text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${
                context === option.value ? "ctx-btn-active" : "ctx-btn"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        {activeOption && <p className="text-muted mt-2 text-xs italic">{activeOption.description}</p>}
      </fieldset>
    </Card>
  );
}
