"use client";

import { useRef, useState } from "react";

type ApiRequestState<T> = {
  data: T | undefined;
  loading: boolean;
  error: string;
  statusCode: number | undefined;
  request: (url: string, body: unknown) => Promise<void>;
  reset: () => void;
};

export function networkErrorMessage(err: unknown, fallback = "Request failed."): string {
  if (err instanceof TypeError && err.message.toLowerCase().includes("failed to fetch")) {
    return "No internet connection. Features that need Solana RPC (wallet lookup, on-chain signatures) are unavailable offline. Screenshot scanning and base64 transaction analysis still work.";
  }
  return err instanceof Error ? err.message : fallback;
}

export function useApiRequest<T>(): ApiRequestState<T> {
  const [data, setData] = useState<T | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [statusCode, setStatusCode] = useState<number | undefined>();
  const inFlight = useRef(false);

  async function request(url: string, body: unknown) {
    if (inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    setError("");
    setStatusCode(undefined);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body)
      });
      const payload = await response.json();
      if (!response.ok) {
        setStatusCode(response.status);
        throw new Error(payload.error ?? "Request failed.");
      }
      setData(payload as T);
    } catch (err) {
      setError(networkErrorMessage(err));
    } finally {
      setLoading(false);
      inFlight.current = false;
    }
  }

  function reset() {
    setData(undefined);
    setError("");
    setStatusCode(undefined);
  }

  return { data, loading, error, statusCode, request, reset };
}
