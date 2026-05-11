import { Search } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import ErrorMessage from "@/components/ui/ErrorMessage";
import RateLimitRetry from "@/components/ui/RateLimitRetry";
import Tag from "@/components/ui/Tag";
import { TEXT_SAMPLES } from "../data";

const MAX_TEXT_CHARS = 12_000;

type Props = {
  pastedText: string;
  loading: boolean;
  error: string;
  statusCode?: number;
  onPastedTextChange: (text: string) => void;
  onScanText: () => void;
  onRetry: () => void;
};

export default function InputText({
  pastedText,
  loading,
  error,
  statusCode,
  onPastedTextChange,
  onScanText,
  onRetry
}: Props) {
  return (
    <Card>
      <label className="text-foreground text-sm font-medium" htmlFor="paste-text">
        Paste message text
      </label>
      <p className="text-muted mt-1 text-xs">
        Paste the text of a message, wallet popup, or airdrop claim to analyze without uploading an image.
        Works with scam and legitimate messages alike.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {TEXT_SAMPLES.map((s) => (
          <Tag key={s.label} variant={s.scam ? "scam" : "safe"} onClick={() => onPastedTextChange(s.text)}>
            {s.label}
          </Tag>
        ))}
      </div>
      <textarea
        id="paste-text"
        value={pastedText}
        maxLength={MAX_TEXT_CHARS}
        onChange={(e) => onPastedTextChange(e.target.value.slice(0, MAX_TEXT_CHARS))}
        rows={5}
        placeholder="Paste any message text here, or pick a sample above..."
        className="border-border bg-surface text-foreground mt-3 w-full rounded-md border px-3 py-2 text-sm"
      />
      <p className="text-muted mt-1 text-right text-xs">
        {pastedText.length.toLocaleString()} / {MAX_TEXT_CHARS.toLocaleString()}
      </p>
      <Button
        className="mt-4 w-full sm:w-auto"
        icon={Search}
        loading={loading}
        onClick={onScanText}
        disabled={!pastedText.trim()}
      >
        Analyze Text
      </Button>
      {statusCode === 429 ? (
        <RateLimitRetry onRetry={onRetry} />
      ) : error ? (
        <ErrorMessage message={error} onRetry={onRetry} />
      ) : null}
    </Card>
  );
}
