import { Clipboard, Search, WifiOff } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import ErrorMessage from "@/components/ui/ErrorMessage";
import Input from "@/components/ui/Input";
import RateLimitRetry from "@/components/ui/RateLimitRetry";
import Tag from "@/components/ui/Tag";
import { WALLET_SAMPLES } from "../data";
import { useOnlineStatus } from "@/lib/hooks/useOnlineStatus";

type Props = {
  address: string;
  loading: boolean;
  error: string;
  statusCode?: number;
  isValidAddress: boolean;
  onAddressChange: (val: string) => void;
  onAnalyze: () => void;
  onRetry: () => void;
};

export default function Address({
  address,
  loading,
  error,
  statusCode,
  isValidAddress,
  onAddressChange,
  onAnalyze,
  onRetry
}: Props) {
  const online = useOnlineStatus();

  async function pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      onAddressChange(text.trim());
    } catch {
      // ignore — permission denied
    }
  }

  return (
    <Card>
      <h2 className="text-foreground text-xl font-semibold">Wallet Risk Profile</h2>
      {!online && (
        <div className="bg-warning/10 border-warning/30 text-warning mt-3 flex items-start gap-2 rounded-lg border px-3 py-2 text-sm">
          <WifiOff size={15} className="mt-0.5 shrink-0" />
          <span>Internet required — wallet lookup fetches live on-chain data via Solana RPC.</span>
        </div>
      )}
      <p className="text-muted mt-3 text-sm">
        Paste a Solana wallet address to check its on-chain risk profile: SOL balance, token accounts, active
        delegates, and recent activity.
      </p>
      <label className="text-foreground mt-5 block text-sm font-medium" htmlFor="wallet-address">
        Wallet address
      </label>
      <div className="mt-1 flex flex-wrap gap-2">
        {WALLET_SAMPLES.map((s) => (
          <Tag
            key={s.address}
            variant={s.scam ? "scam" : "safe"}
            onClick={() => onAddressChange(s.address)}
            title={s.description}
          >
            {s.label}
          </Tag>
        ))}
      </div>
      <div className="relative mt-2">
        <Input
          id="wallet-address"
          type="text"
          variant="mono"
          value={address}
          onChange={(e) => onAddressChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !loading && isValidAddress && onAnalyze()}
          placeholder="Solana wallet address (base58)"
          className="pr-10"
        />
        <button
          type="button"
          aria-label="Paste from clipboard"
          onClick={pasteFromClipboard}
          className="text-muted hover:text-foreground absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 transition-colors"
        >
          <Clipboard size={15} />
        </button>
      </div>
      <Button
        className="mt-4 w-full sm:w-auto"
        icon={Search}
        loading={loading}
        onClick={onAnalyze}
        disabled={!isValidAddress || !online}
      >
        Analyze Wallet
      </Button>
      {address.trim() && !isValidAddress && (
        <p className="text-danger mt-2 text-xs">Enter a valid Solana address (base58, 32–44 chars).</p>
      )}
      {statusCode === 429 ? (
        <RateLimitRetry onRetry={onRetry} />
      ) : error ? (
        <ErrorMessage message={error} onRetry={onRetry} />
      ) : null}
    </Card>
  );
}
