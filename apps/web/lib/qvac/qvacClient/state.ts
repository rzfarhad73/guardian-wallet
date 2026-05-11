/**
 * Global runtime state persisted on `globalThis` so Next.js dev-mode hot
 * reloads don't reset it. Model-load callbacks fire once in the original
 * module instance — if the module is re-evaluated, runtimeStatus would
 * otherwise reset to "configured" even though models are already active.
 */
import type { QvacCapabilityDiagnostics, QvacClient } from "../types";
import type { CapabilityKey } from "./sdkTypes";

interface CapabilityState {
  status: import("../types").QvacCapabilityStatus;
  lastError?: string;
  lastActiveAt?: string;
}

declare global {
  var __qvac_sdkQueue: Promise<unknown> | undefined;
  var __qvac_modelsReadyPromise: Promise<import("./sdkTypes").ModelIds> | undefined;
  var __qvac_runtimeStatus: Record<CapabilityKey, CapabilityState> | undefined;
  var __qvac_modelIds: { llm?: string; ocr?: string; embedding?: string } | undefined;
  var __qvac_langModelCache: Map<string, Promise<string>> | undefined;
  var __qvac_cyrillicOcrPromise: Promise<string | null> | undefined;
  var __qvac_cjkOcrPromise: Promise<string | null> | undefined;
}

globalThis.__qvac_sdkQueue ??= Promise.resolve();
globalThis.__qvac_runtimeStatus ??= {
  llm: { status: "configured" },
  ocr: { status: "configured" },
  embeddings: { status: "configured" },
  translation: { status: "configured" }
};

export function setModelIds(ids: { llm: string; ocr: string; embedding: string }): void {
  globalThis.__qvac_modelIds = ids;
}

/** Serialize SDK calls through a global promise queue to prevent overlapping loads. */
export function queueSdkCall<T>(fn: () => Promise<T>): Promise<T> {
  const next = (globalThis.__qvac_sdkQueue as Promise<unknown>).then(fn);
  globalThis.__qvac_sdkQueue = next.then(
    () => undefined,
    () => undefined
  );
  return next;
}

export function setCapabilityStatus(
  capability: CapabilityKey,
  status: import("../types").QvacCapabilityStatus,
  error?: string
): void {
  const prev = globalThis.__qvac_runtimeStatus![capability];
  globalThis.__qvac_runtimeStatus![capability] = {
    status,
    lastError: status === "error" ? (error ?? prev.lastError) : prev.lastError,
    lastActiveAt: status === "active" ? new Date().toISOString() : prev.lastActiveAt
  };
}

function toDiagnostics(state: CapabilityState): QvacCapabilityDiagnostics {
  const d: QvacCapabilityDiagnostics = { status: state.status };
  if (state.lastError !== undefined) d.lastError = state.lastError;
  if (state.lastActiveAt !== undefined) d.lastActiveAt = state.lastActiveAt;
  return d;
}

export function getStatusSnapshot(modelIds?: {
  llm?: string;
  ocr?: string;
  embedding?: string;
}): NonNullable<QvacClient["status"]> {
  const s = globalThis.__qvac_runtimeStatus!;
  const resolvedModelIds = modelIds ?? globalThis.__qvac_modelIds;
  return {
    llm: toDiagnostics(s.llm),
    ocr: toDiagnostics(s.ocr),
    embeddings: toDiagnostics(s.embeddings),
    rag: { status: "active" },
    translation: toDiagnostics(s.translation),
    ...(resolvedModelIds ? { modelIds: resolvedModelIds } : {})
  };
}
