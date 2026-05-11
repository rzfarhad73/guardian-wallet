"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";

const COUNTDOWN_SECONDS = 5;

export default function RateLimitRetry({ onRetry }: { onRetry: () => void }) {
  const [seconds, setSeconds] = useState(COUNTDOWN_SECONDS);

  useEffect(() => {
    if (seconds <= 0) {
      onRetry();
      return;
    }
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [seconds, onRetry]);

  return (
    <div className="mt-3 space-y-2">
      <p className="text-warn-fg text-sm font-medium">
        Solana RPC rate limit reached.{" "}
        {seconds > 0 ? (
          <span>
            Retrying automatically in <span className="font-bold">{seconds}s</span>…
          </span>
        ) : (
          <span>Retrying…</span>
        )}
      </p>
      <div className="bg-border h-1 w-full overflow-hidden rounded-full">
        <div
          className="bg-primary h-1 rounded-full transition-all duration-1000"
          style={{ width: `${(seconds / COUNTDOWN_SECONDS) * 100}%` }}
        />
      </div>
      <Button
        variant="secondary"
        onClick={() => {
          setSeconds(0);
        }}
      >
        Retry now
      </Button>
    </div>
  );
}
