import type { ViewerContext } from "@/lib/solana/types";
import type { GuardianPolicy } from "@/lib/risk/policy";
import InputContext from "./Context";
import InputPolicy from "./Policy";
import InputTransaction from "./Transaction";

type Props = {
  base64Transaction: string;
  context: ViewerContext;
  policy: GuardianPolicy;
  userIntent: string;
  loading: boolean;
  error: string;
  statusCode?: number;
  onBase64Change: (val: string) => void;
  onContextChange: (ctx: ViewerContext) => void;
  onPolicyChange: (policy: GuardianPolicy) => void;
  onUserIntentChange: (val: string) => void;
  onAnalyze: () => void;
  onRetry: () => void;
};

export default function Input({
  base64Transaction,
  context,
  policy,
  userIntent,
  loading,
  error,
  statusCode,
  onBase64Change,
  onContextChange,
  onPolicyChange,
  onUserIntentChange,
  onAnalyze,
  onRetry
}: Props) {
  return (
    <section className="min-w-0 space-y-6">
      <InputContext context={context} onContextChange={onContextChange} />
      <InputPolicy policy={policy} onPolicyChange={onPolicyChange} />
      <InputTransaction
        base64Transaction={base64Transaction}
        userIntent={userIntent}
        loading={loading}
        error={error}
        statusCode={statusCode}
        onBase64Change={onBase64Change}
        onUserIntentChange={onUserIntentChange}
        onAnalyze={onAnalyze}
        onRetry={onRetry}
      />
    </section>
  );
}
