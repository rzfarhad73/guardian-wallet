"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useApiRequest } from "@/lib/hooks/useApiRequest";
import { DEFAULT_GUARDIAN_POLICY } from "@/lib/risk/policy";
import type { ViewerContext } from "@/lib/solana/types";
import Input from "./input";
import Results from "./results";
import type { TransactionResult } from "./types";

export default function TransactionAnalyzer() {
  const searchParams = useSearchParams();
  const [base64Transaction, setBase64Transaction] = useState(() => searchParams.get("tx") ?? "");
  const [context, setContext] = useState<ViewerContext>("pre-sign");
  const [policy, setPolicy] = useState(DEFAULT_GUARDIAN_POLICY);
  const [userIntent, setUserIntent] = useState("");
  const { data: result, loading, error, statusCode, request, reset } = useApiRequest<TransactionResult>();

  // Auto-analyze when the page is opened with ?tx= from the extension
  useEffect(() => {
    const tx = searchParams.get("tx");
    if (tx) {
      setBase64Transaction(tx);
      reset();
      void request("/api/analyze-transaction", { base64Transaction: tx, context, policy });
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function analyze() {
    reset();
    void request("/api/analyze-transaction", {
      base64Transaction,
      context,
      policy,
      ...(userIntent.trim() ? { userIntent: userIntent.trim() } : {})
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <Input
        base64Transaction={base64Transaction}
        context={context}
        policy={policy}
        userIntent={userIntent}
        loading={loading}
        error={error}
        statusCode={statusCode}
        onBase64Change={setBase64Transaction}
        onContextChange={setContext}
        onPolicyChange={setPolicy}
        onUserIntentChange={setUserIntent}
        onAnalyze={analyze}
        onRetry={() => {
          reset();
          analyze();
        }}
      />
      <Results result={result ?? undefined} loading={loading} />
    </div>
  );
}
