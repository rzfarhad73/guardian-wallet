import "server-only";
import scamPatterns from "../../../../knowledge/scam-patterns.json";
import type { QvacClient, ScamPattern, ScamPatternMatch } from "./types";
import { cosineSimilarity } from "./vector";

declare global {
  var __qvac_scamPatternEmbeddings: Array<{ pattern: ScamPattern; embedding: number[] }> | undefined;
}

// Use globalThis so Next.js dev-mode hot reloads don't re-embed on every code change.
Object.defineProperty(globalThis, "__qvac_scamPatternEmbeddings", {
  writable: true,
  configurable: true,
  value: globalThis.__qvac_scamPatternEmbeddings
});

function patternText(pattern: ScamPattern) {
  return `${pattern.title}. ${pattern.text} Example phrases: ${pattern.examplePhrases.join(", ")}`;
}

const MIN_SIMILARITY = 0.85;

export async function searchScamPatterns(
  qvac: QvacClient,
  query: string,
  topK = 5
): Promise<ScamPatternMatch[]> {
  const patterns = scamPatterns as ScamPattern[];
  globalThis.__qvac_scamPatternEmbeddings ??= await Promise.all(
    patterns.map(async (pattern) => ({
      pattern,
      embedding: await qvac.embeddings.embed({ text: patternText(pattern) })
    }))
  );

  const queryEmbedding = await qvac.embeddings.embed({ text: query });
  return globalThis
    .__qvac_scamPatternEmbeddings!.map(({ pattern, embedding }) => ({
      ...pattern,
      similarity: cosineSimilarity(queryEmbedding, embedding)
    }))
    .filter((m) => m.similarity >= MIN_SIMILARITY)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);
}
