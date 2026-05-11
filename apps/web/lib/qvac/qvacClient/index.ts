import "server-only";
import type { QvacClient } from "../types";
import { queueSdkCall, setCapabilityStatus, getStatusSnapshot } from "./state";
import {
  loadSdk,
  getModelsReady,
  getCjkOcrModelId,
  getCyrillicOcrModelId,
  getTranslationModelId
} from "./modelLoader";
import { looksLikeGarbageOcr, detectScriptLanguage, toBuffer } from "./textUtils";

export { getStatusSnapshot as getQvacStatus } from "./state";
export { warmupModels } from "./modelLoader";

async function tryFallbackOcr(
  sdk: Awaited<ReturnType<typeof loadSdk>>,
  imgBuf: Buffer
): Promise<{ text: string; blocks: Array<{ text: string; confidence?: number; bbox?: number[] }> } | null> {
  const fallbacks = [getCyrillicOcrModelId, getCjkOcrModelId];
  let bestResult: {
    text: string;
    blocks: Array<{ text: string; confidence?: number; bbox?: number[] }>;
  } | null = null;
  for (const getModelId of fallbacks) {
    try {
      const modelId = await getModelId(sdk);
      if (!modelId) continue;
      const fallbackBlocks = (await queueSdkCall(
        () => sdk.ocr({ modelId, image: imgBuf, stream: false }).blocks
      )) as Array<{ text: string; confidence?: number; bbox?: number[] }>;
      const fallbackText = fallbackBlocks.map((b) => b.text).join("\n");
      if (!fallbackText.trim()) continue;
      // Only accept if confidence is better than what a garbage read produces
      if (!looksLikeGarbageOcr(fallbackText, fallbackBlocks)) {
        return { text: fallbackText, blocks: fallbackBlocks };
      }
      // Keep as fallback-of-last-resort if we find nothing better
      if (!bestResult) bestResult = { text: fallbackText, blocks: fallbackBlocks };
    } catch {
      // try next fallback
    }
  }
  return bestResult;
}

export function getQvacClient(): QvacClient {
  return {
    mode: "qvac",
    get status() {
      return getStatusSnapshot();
    },
    llm: {
      async generate({ systemPrompt, userPrompt, temperature = 0.2, maxTokens = 700 }) {
        try {
          const sdk = await loadSdk();
          const { llm: modelId } = await getModelsReady();
          const result = await queueSdkCall(() => {
            const r = sdk.completion({
              modelId,
              stream: false,
              history: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
              ],
              generationParams: {
                temp: temperature,
                predict: maxTokens
              },
              responseFormat: { type: "json_object" }
            });
            return r.text;
          });
          setCapabilityStatus("llm", "active");
          return result;
        } catch (error) {
          setCapabilityStatus("llm", "error", error instanceof Error ? error.message : String(error));
          throw error;
        }
      }
    },
    ocr: {
      async extractText({ image }) {
        try {
          const sdk = await loadSdk();
          const { ocr: modelId } = await getModelsReady();
          const imgBuf = await toBuffer(image);
          const blocks = await queueSdkCall(() => sdk.ocr({ modelId, image: imgBuf, stream: false }).blocks);
          const text = blocks.map((block) => block.text).join("\n");

          // If the Latin recogniser produced garbage (e.g. CJK image), retry
          // with the CJK recogniser. Even a short CJK read is more useful.
          if (looksLikeGarbageOcr(text, blocks)) {
            const fallbackResult = await tryFallbackOcr(sdk, imgBuf);
            if (fallbackResult) {
              setCapabilityStatus("ocr", "active");
              return fallbackResult;
            }
          }

          setCapabilityStatus("ocr", "active");
          return { text, blocks };
        } catch (error) {
          setCapabilityStatus("ocr", "error", error instanceof Error ? error.message : String(error));
          throw error;
        }
      }
    },
    embeddings: {
      async embed({ text }) {
        try {
          const sdk = await loadSdk();
          const { embedding: modelId } = await getModelsReady();
          const result = await queueSdkCall(() => sdk.embed({ modelId, text }));
          setCapabilityStatus("embeddings", "active");
          return result.embedding;
        } catch (error) {
          setCapabilityStatus("embeddings", "error", error instanceof Error ? error.message : String(error));
          throw error;
        }
      }
    },
    translation: {
      async translate({ text }) {
        // Detect language synchronously first — always returns a detectedLanguage
        // even when the SDK or model fails to load.
        const detectedLang = detectScriptLanguage(text);
        if (detectedLang === "en") {
          return { translatedText: text, detectedLanguage: "en", wasTranslated: false };
        }
        try {
          const sdk = await loadSdk();
          const modelId = await getTranslationModelId(sdk, detectedLang);
          if (!modelId) {
            setCapabilityStatus("translation", "not configured");
            return { translatedText: text, detectedLanguage: detectedLang, wasTranslated: false };
          }
          setCapabilityStatus("translation", "loading");
          const translatedText = await queueSdkCall(
            () => sdk.translate({ modelId, text, stream: false, modelType: "nmtcpp-translation" }).text
          );
          setCapabilityStatus("translation", "active");
          return { translatedText, detectedLanguage: detectedLang, wasTranslated: true };
        } catch (error) {
          setCapabilityStatus("translation", "error", error instanceof Error ? error.message : String(error));
          return { translatedText: text, detectedLanguage: detectedLang, wasTranslated: false };
        }
      }
    }
  };
}
