"use client";

import { useEffect, useState } from "react";
import { qvacBadgeClass } from "@/components/ui/QvacBadge";

type CapabilityInfo = { status: string; lastError?: string; lastActiveAt?: string } | string;

type Status = {
  llm: CapabilityInfo;
  ocr: CapabilityInfo;
  embeddings: CapabilityInfo;
  rag: CapabilityInfo;
  translation: CapabilityInfo;
  modelIds?: { llm?: string; ocr?: string; embedding?: string };
};

function capStatus(info: CapabilityInfo): string {
  return typeof info === "string" ? info : (info.status ?? "");
}

function capLastError(info: CapabilityInfo): string | undefined {
  return typeof info === "string" ? undefined : info.lastError;
}

function statusBadgeClass(value: string) {
  if (value === "active" || value === "none") return qvacBadgeClass(true);
  if (value === "not configured" || value === "configured" || value === "loading") return "badge-neutral";
  return qvacBadgeClass(false);
}

function formatStatusValue(value: string) {
  if (value === "mock") return "Mock AI";
  if (value === "active") return "Active";
  if (value === "none") return "None";
  if (value === "configured") return "Configured";
  if (value === "loading") return "Loading";
  if (value === "error") return "Error";
  if (value === "not configured") return "Not configured";
  return value;
}

// Stable placeholder — identical on server and client during SSR/hydration
const LOADING_ITEMS: Array<[string, string, string?]> = [
  ["QVAC LLM", "loading…"],
  ["QVAC OCR", "loading…"],
  ["QVAC embeddings", "loading…"],
  ["QVAC translation", "loading…"],
  ["Local knowledge base", "active"]
];

export default function StatusBanner() {
  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState<Status | undefined>();

  useEffect(() => {
    setMounted(true);
    let id: ReturnType<typeof setInterval>;
    let active = true;

    function scheduleNext(isLoading: boolean) {
      id = setInterval(
        () => {
          clearInterval(id);
          fetchStatus();
        },
        isLoading ? 2_000 : 10_000
      );
    }

    function fetchStatus() {
      fetch("/api/qvac-status")
        .then((r) => r.json())
        .then((p) => {
          if (!active) return;
          setStatus(p.status);
          const isLoading = (["llm", "ocr", "embeddings", "translation"] as const).some((k) => {
            const v = capStatus((p.status as Status)[k]);
            return v === "loading" || v === "configured";
          });
          scheduleNext(isLoading);
        })
        .catch(() => {
          if (active) scheduleNext(true);
        });
    }

    // Defer off the critical path — let the browser finish LCP first
    const deferTimer = setTimeout(fetchStatus, 300);
    return () => {
      active = false;
      clearTimeout(deferTimer);
      clearInterval(id);
    };
  }, []);

  if (!mounted) return null;

  const items: Array<[string, string, string?]> = status
    ? [
        ["QVAC LLM", capStatus(status.llm), capLastError(status.llm)],
        ["QVAC OCR", capStatus(status.ocr), capLastError(status.ocr)],
        ["QVAC embeddings", capStatus(status.embeddings), capLastError(status.embeddings)],
        [
          "QVAC translation",
          capStatus(status.translation) || "not configured",
          capLastError(status.translation)
        ],
        ["Local knowledge base", capStatus(status.rag) || "active"]
      ]
    : LOADING_ITEMS;

  const allActive =
    status &&
    capStatus(status.llm) === "active" &&
    capStatus(status.ocr) === "active" &&
    capStatus(status.embeddings) === "active" &&
    capStatus(status.translation) === "active";

  return (
    <div className="shadow-soft border-border bg-surface rounded-lg border p-4 dark:ring-1 dark:ring-white/10">
      <div className="flex flex-wrap gap-2">
        {items.map(([label, value, lastError]) => (
          <span
            key={label}
            title={value === "error" && lastError ? `Last error: ${lastError}` : undefined}
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusBadgeClass(value)}`}
          >
            {label}: <span className="font-bold">{formatStatusValue(value)}</span>
          </span>
        ))}
      </div>
      <p className="text-muted mt-3 text-sm">
        {allActive
          ? "All QVAC AI modules active on-device. No cloud AI used. Wallet profile lookups use the public Solana RPC."
          : "QVAC modules are configured locally and turn active after successful on-device inference. Wallet profile lookups use Solana RPC."}
      </p>
    </div>
  );
}
