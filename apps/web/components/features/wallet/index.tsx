"use client";

import { useState } from "react";
import { useApiRequest } from "@/lib/hooks/useApiRequest";
import Input from "./input";
import Results from "./Results";
import type { WalletResult } from "./types";

export default function WalletAnalyzer({ onOpenTransaction }: { onOpenTransaction?: () => void }) {
  const [address, setAddress] = useState("");
  const { data: result, loading, error, statusCode, request, reset } = useApiRequest<WalletResult>();

  const isValidAddress = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address.trim());

  function analyze() {
    if (!isValidAddress) return;
    reset();
    void request("/api/wallet-profile", { address: address.trim() });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <Input
        address={address}
        loading={loading}
        error={error}
        statusCode={statusCode}
        isValidAddress={isValidAddress}
        result={result ?? undefined}
        onAddressChange={setAddress}
        onAnalyze={analyze}
        onRetry={() => {
          reset();
          analyze();
        }}
      />
      <Results result={result ?? undefined} loading={loading} onOpenTransaction={onOpenTransaction} />
    </div>
  );
}
