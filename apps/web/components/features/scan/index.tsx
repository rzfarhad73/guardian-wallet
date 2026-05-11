"use client";

import { useRef, useState, useEffect } from "react";
import Input from "./input";
import Results from "./results";
import type { ScanResult } from "./types";
import { networkErrorMessage } from "@/lib/hooks/useApiRequest";

export default function ScreenshotScanner() {
  const [file, setFile] = useState<File | undefined>();
  const [preview, setPreview] = useState("");
  const [pastedText, setPastedText] = useState("");
  const [result, setResult] = useState<ScanResult | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [statusCode, setStatusCode] = useState<number | undefined>();
  const [lastAction, setLastAction] = useState<"upload" | "text" | null>(null);
  const inFlight = useRef(false);
  const resultsRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if ((result || loading) && resultsRef.current) {
      if (window.innerWidth < 768) {
        resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [result, loading]);

  function onFileChange(nextFile?: File) {
    setFile(nextFile);
    setPreview(nextFile ? URL.createObjectURL(nextFile) : "");
  }

  async function loadSample(filename: string) {
    const url = `/samples/${filename}`;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const f = new File([blob], filename, { type: "image/png" });
      setFile(f);
      setPreview(url);
    } catch {
      setError(`Could not load sample image "${filename}". Make sure the dev server is running.`);
    }
  }

  async function scanUpload() {
    if (inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    setResult(undefined);
    setError("");
    setStatusCode(undefined);
    setLastAction("upload");
    try {
      const formData = new FormData();
      if (file) formData.set("image", file);
      const response = await fetch("/api/scan-screenshot", { method: "POST", body: formData });
      const payload = await response.json();
      if (!response.ok) {
        setStatusCode(response.status);
        throw new Error(payload.error ?? "Scan failed.");
      }
      setResult(payload);
    } catch (scanError) {
      setError(networkErrorMessage(scanError, "Scan failed."));
    } finally {
      setLoading(false);
      inFlight.current = false;
    }
  }

  function retry() {
    setError("");
    setStatusCode(undefined);
    void (lastAction === "text" ? scanText() : scanUpload());
  }

  async function scanText() {
    if (inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    setResult(undefined);
    setError("");
    setStatusCode(undefined);
    setLastAction("text");
    try {
      const response = await fetch("/api/scan-screenshot", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: pastedText })
      });
      const payload = await response.json();
      if (!response.ok) {
        setStatusCode(response.status);
        throw new Error(payload.error ?? "Scan failed.");
      }
      setResult(payload);
    } catch (scanError) {
      setError(networkErrorMessage(scanError, "Scan failed."));
    } finally {
      setLoading(false);
      inFlight.current = false;
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <Input
        file={file}
        preview={preview}
        pastedText={pastedText}
        loading={loading}
        error={error}
        statusCode={statusCode}
        lastAction={lastAction}
        onFileChange={onFileChange}
        onLoadSample={loadSample}
        onPastedTextChange={setPastedText}
        onScanUpload={scanUpload}
        onScanText={scanText}
        onRetry={retry}
      />
      <Results result={result} loading={loading} lastAction={lastAction} resultsRef={resultsRef} />
    </div>
  );
}
