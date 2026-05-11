import type { RiskLevel } from "../solana/types";

export type QvacCapabilityStatus = "not configured" | "configured" | "loading" | "active" | "error";

/** Thin wrapper around the QVAC LLM capability — generates text from a system + user prompt pair. */
export interface QvacLlmClient {
  generate(input: {
    systemPrompt: string;
    userPrompt: string;
    temperature?: number;
    maxTokens?: number;
  }): Promise<string>;
}

/** Thin wrapper around the QVAC OCR capability — extracts text blocks from images. */
export interface QvacOcrClient {
  extractText(input: { image: File | Blob | ArrayBuffer | Buffer }): Promise<{
    text: string;
    blocks?: Array<{
      text: string;
      confidence?: number;
      bbox?: number[];
    }>;
  }>;
}

/** Thin wrapper around the QVAC embedding capability — returns a dense vector for a text string. */
export interface QvacEmbeddingClient {
  embed(input: { text: string }): Promise<number[]>;
}

/** Thin wrapper around the QVAC offline translation capability (@qvac/translation-nmtcpp). */
export interface QvacTranslationClient {
  translate(input: {
    text: string;
    targetLang?: string;
  }): Promise<{ translatedText: string; detectedLanguage: string; wasTranslated: boolean }>;
}

/** Per-capability diagnostics included in the status snapshot. */
export interface QvacCapabilityDiagnostics {
  status: QvacCapabilityStatus;
  lastError?: string;
  lastActiveAt?: string; // ISO-8601
}

/** Aggregated QVAC client exposing LLM, OCR, embeddings, translation, and runtime status. */
export interface QvacClient {
  llm: QvacLlmClient;
  ocr: QvacOcrClient;
  embeddings: QvacEmbeddingClient;
  translation: QvacTranslationClient;
  mode: "qvac";
  status?: {
    llm: QvacCapabilityDiagnostics;
    ocr: QvacCapabilityDiagnostics;
    embeddings: QvacCapabilityDiagnostics;
    rag: { status: "active" };
    translation: QvacCapabilityDiagnostics;
    modelIds?: { llm?: string; ocr?: string; embedding?: string };
  };
}

/** A single entry from the local scam-pattern knowledge base (`knowledge/scam-patterns.json`). */
export interface ScamPattern {
  id: string;
  title: string;
  category: string;
  severity: "low" | "medium" | "high" | "critical";
  text: string;
  examplePhrases: string[];
}

/** A `ScamPattern` augmented with a cosine-similarity score from the local RAG search. */
export interface ScamPatternMatch extends ScamPattern {
  similarity: number;
}

/** Full result shape returned by the `scan-screenshot` API route. */
export interface ScreenshotScanResult {
  mode: QvacClient["mode"];
  riskLevel: RiskLevel;
  riskScore: number;
  extractedText: string;
  matches: ScamPatternMatch[];
  explanation: unknown;
}
