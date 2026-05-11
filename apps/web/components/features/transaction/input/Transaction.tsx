import { Search, WifiOff } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import ErrorMessage from "@/components/ui/ErrorMessage";
import Input from "@/components/ui/Input";
import RateLimitRetry from "@/components/ui/RateLimitRetry";
import Tag, { type TagVariant } from "@/components/ui/Tag";
import { TRANSACTION_SAMPLES } from "../data";
import { useOnlineStatus } from "@/lib/hooks/useOnlineStatus";

const SOLANA_SIGNATURE_RE = /^[1-9A-HJ-NP-Za-km-z]{87,88}$/;

const riskVariant: Record<"low" | "medium" | "high", TagVariant> = {
  low: "safe",
  medium: "neutral",
  high: "scam"
};

type Props = {
  base64Transaction: string;
  userIntent: string;
  loading: boolean;
  error: string;
  statusCode?: number;
  onBase64Change: (val: string) => void;
  onUserIntentChange: (val: string) => void;
  onAnalyze: () => void;
  onRetry: () => void;
};

export default function InputTransaction({
  base64Transaction,
  userIntent,
  loading,
  error,
  statusCode,
  onBase64Change,
  onUserIntentChange,
  onAnalyze,
  onRetry
}: Props) {
  const online = useOnlineStatus();
  const isSignature = SOLANA_SIGNATURE_RE.test(base64Transaction.trim());
  const needsNetwork = isSignature;
  return (
    <Card>
      <label className="text-foreground text-sm font-medium" htmlFor="base64-transaction">
        Paste transaction or signature
      </label>
      {!online && needsNetwork && (
        <div className="bg-warning/10 border-warning/30 text-warning mt-2 flex items-start gap-2 rounded-lg border px-3 py-2 text-sm">
          <WifiOff size={15} className="mt-0.5 shrink-0" />
          <span>
            Internet required — on-chain signature lookup needs Solana RPC. Paste a base64 transaction to
            analyze offline.
          </span>
        </div>
      )}
      <p className="text-muted mt-1 text-xs">
        Paste a base64 serialized transaction, or a Solana transaction signature (base58, 88 chars) to fetch
        from mainnet.
      </p>
      <div className="mt-2 space-y-2">
        {(["safe", "scam"] as const).map((group) => {
          const groupSamples = TRANSACTION_SAMPLES.filter((s) => s.group === group);
          return (
            <div key={group}>
              <p className="text-muted mb-1 text-xs font-medium">
                {group === "safe" ? "Safe examples:" : "Dangerous examples (demo):"}
              </p>
              <div className="flex flex-wrap gap-2">
                {groupSamples.map((s) => (
                  <Tag
                    key={s.sig}
                    variant={riskVariant[s.risk]}
                    title={s.sig}
                    onClick={() => {
                      onBase64Change(s.sig);
                      onUserIntentChange(s.intent);
                    }}
                  >
                    {s.label}
                  </Tag>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <textarea
        id="base64-transaction"
        value={base64Transaction}
        onChange={(e) => onBase64Change(e.target.value)}
        rows={5}
        className="border-border bg-surface text-foreground mt-2 w-full rounded-md border px-3 py-2 font-mono text-xs"
        placeholder="Base64 transaction or on-chain signature..."
      />
      <div className="mt-4 space-y-2">
        <label className="text-foreground text-sm font-medium" htmlFor="user-intent">
          What do you think this transaction does? <span className="text-muted font-normal">(optional)</span>
        </label>
        <p className="text-muted text-xs">
          e.g. &ldquo;Claim my airdrop&rdquo;, &ldquo;Swap SOL for USDC&rdquo;. Guardian will check if the
          transaction actually matches your intent.
        </p>
        <Input
          id="user-intent"
          type="text"
          value={userIntent}
          onChange={(e) => onUserIntentChange(e.target.value)}
          placeholder="Describe what you expect this to do…"
          maxLength={200}
        />
      </div>
      <Button
        variant="primary"
        className="mt-4 w-full sm:w-auto"
        icon={Search}
        loading={loading}
        onClick={onAnalyze}
        disabled={!base64Transaction.trim() || (!online && needsNetwork)}
      >
        Analyze Pasted Transaction
      </Button>
      {statusCode === 429 ? (
        <RateLimitRetry onRetry={onRetry} />
      ) : error ? (
        <ErrorMessage message={error} onRetry={onRetry} />
      ) : null}
    </Card>
  );
}
