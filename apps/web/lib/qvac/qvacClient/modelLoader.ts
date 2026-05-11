import type { QvacSdk, ModelIds } from "./sdkTypes";
import { queueSdkCall, setCapabilityStatus, setModelIds } from "./state";

export async function loadSdk(): Promise<QvacSdk> {
  return (await import("@qvac/sdk")) as unknown as QvacSdk;
}

export function resolveModelSrc(sdk: QvacSdk, envPath: string | undefined, presetName: string): unknown {
  if (envPath) return envPath;
  const preset = sdk[presetName];
  if (!preset) {
    throw new Error(
      `QVAC preset ${presetName} was not exported by @qvac/sdk. Set a local model path instead.`
    );
  }
  return preset;
}

/** Maps ISO 639-1 language code → QVAC SDK preset name. */
export const LANG_PAIR_PRESETS: Record<string, string> = {
  ar: "BERGAMOT_AR_EN",
  ru: "BERGAMOT_RU_EN",
  zh: "BERGAMOT_ZH_EN",
  es: "BERGAMOT_ES_EN",
  tr: "BERGAMOT_TR_EN"
};

const langModelCache = new Map<string, Promise<string>>();

// Move secondary model caches to globalThis so they survive Next.js hot reloads.
globalThis.__qvac_langModelCache ??= langModelCache;
globalThis.__qvac_cyrillicOcrPromise ??= undefined;
globalThis.__qvac_cjkOcrPromise ??= undefined;

export async function getTranslationModelId(sdk: QvacSdk, lang: string): Promise<string | null> {
  const presetName = process.env.QVAC_TRANSLATE_MODEL_PRESET ?? LANG_PAIR_PRESETS[lang];
  if (!presetName) return null;
  const modelSrc = process.env.QVAC_TRANSLATE_MODEL_SRC ?? sdk[presetName];
  if (!modelSrc) return null;

  const cache = globalThis.__qvac_langModelCache!;
  if (!cache.has(lang)) {
    cache.set(
      lang,
      queueSdkCall(() =>
        sdk.loadModel({
          modelSrc,
          modelType: "nmtcpp-translation",
          modelConfig: { engine: "Bergamot", from: lang, to: "en" }
        })
      ) as Promise<string>
    );
  }
  return cache.get(lang)!;
}

export async function getCyrillicOcrModelId(sdk: QvacSdk): Promise<string | null> {
  if (!globalThis.__qvac_cyrillicOcrPromise) {
    const src = process.env.QVAC_OCR_CYRILLIC_MODEL_SRC ?? sdk["OCR_CYRILLIC_RECOGNIZER"];
    if (!src) return null;
    globalThis.__qvac_cyrillicOcrPromise = (
      queueSdkCall(() =>
        sdk.loadModel({
          modelSrc: src,
          modelType: "onnx-ocr",
          modelConfig: {
            langList: ["ru"],
            useGPU: process.env.QVAC_DEVICE === "gpu",
            timeout: Number(process.env.QVAC_OCR_TIMEOUT_MS ?? 30000),
            magRatio: Number(process.env.QVAC_OCR_MAG_RATIO ?? 2.0),
            defaultRotationAngles: [90, 180, 270],
            contrastRetry: true,
            lowConfidenceThreshold: 0.5,
            recognizerBatchSize: 1
          }
        })
      ) as Promise<string>
    ).catch(() => null);
  }
  return globalThis.__qvac_cyrillicOcrPromise;
}

export async function getCjkOcrModelId(sdk: QvacSdk): Promise<string | null> {
  if (!globalThis.__qvac_cjkOcrPromise) {
    const cjkSrc = process.env.QVAC_OCR_CJK_MODEL_SRC ?? sdk["OCR_ZH_SIM_RECOGNIZER"];
    if (!cjkSrc) return null;
    globalThis.__qvac_cjkOcrPromise = queueSdkCall(() =>
      sdk.loadModel({
        modelSrc: cjkSrc,
        modelType: "onnx-ocr",
        modelConfig: {
          langList: ["ch_sim", "en"],
          useGPU: process.env.QVAC_DEVICE === "gpu",
          timeout: Number(process.env.QVAC_OCR_TIMEOUT_MS ?? 30000),
          magRatio: Number(process.env.QVAC_OCR_MAG_RATIO ?? 2.0),
          defaultRotationAngles: [90, 180, 270],
          contrastRetry: true,
          lowConfidenceThreshold: 0.5,
          recognizerBatchSize: 1
        }
      })
    ) as Promise<string>;
    globalThis.__qvac_cjkOcrPromise = globalThis.__qvac_cjkOcrPromise.catch(() => null);
  }
  return globalThis.__qvac_cjkOcrPromise;
}

export function getModelsReady(): Promise<ModelIds> {
  if (!globalThis.__qvac_modelsReadyPromise) {
    globalThis.__qvac_modelsReadyPromise = loadSdk()
      .then(async (sdk) => {
        const embeddingSrc = resolveModelSrc(
          sdk,
          process.env.QVAC_EMBED_MODEL_SRC,
          process.env.QVAC_EMBED_MODEL_PRESET ?? "GTE_LARGE_FP16"
        );
        setCapabilityStatus("embeddings", "loading");
        const embedding = await queueSdkCall(() =>
          sdk.loadModel({
            modelSrc: embeddingSrc,
            modelType: "llamacpp-embedding",
            modelConfig: { device: process.env.QVAC_DEVICE ?? "cpu" }
          })
        );
        setCapabilityStatus("embeddings", "active");

        const llmSrc = resolveModelSrc(
          sdk,
          process.env.QVAC_LLM_MODEL_SRC,
          process.env.QVAC_LLM_MODEL_PRESET ?? "LLAMA_3_2_1B_INST_Q4_0"
        );
        setCapabilityStatus("llm", "loading");
        const llm = await queueSdkCall(() =>
          sdk.loadModel({
            modelSrc: llmSrc,
            modelType: "llamacpp-completion",
            modelConfig: {
              ctx_size: Number(process.env.QVAC_LLM_CONTEXT_SIZE ?? 4096),
              device: process.env.QVAC_DEVICE ?? "cpu",
              temp: Number(process.env.QVAC_LLM_TEMPERATURE ?? 0.2)
            }
          })
        );
        setCapabilityStatus("llm", "active");

        const ocrSrc = resolveModelSrc(
          sdk,
          process.env.QVAC_OCR_MODEL_SRC,
          process.env.QVAC_OCR_MODEL_PRESET ?? "OCR_LATIN_RECOGNIZER_1"
        );
        setCapabilityStatus("ocr", "loading");
        const ocr = await queueSdkCall(() =>
          sdk.loadModel({
            modelSrc: ocrSrc,
            modelType: "onnx-ocr",
            modelConfig: {
              langList: ["en"],
              useGPU: process.env.QVAC_DEVICE === "gpu",
              timeout: Number(process.env.QVAC_OCR_TIMEOUT_MS ?? 30000),
              magRatio: Number(process.env.QVAC_OCR_MAG_RATIO ?? 2.0),
              defaultRotationAngles: [90, 180, 270],
              contrastRetry: true,
              lowConfidenceThreshold: 0.5,
              recognizerBatchSize: 1
            }
          })
        );
        setCapabilityStatus("ocr", "active");

        const ids = { embedding, llm, ocr };
        setModelIds(ids);
        return ids;
      })
      .catch((error) => {
        for (const capability of ["llm", "ocr", "embeddings"] as const) {
          if (globalThis.__qvac_runtimeStatus![capability].status === "loading") {
            setCapabilityStatus(capability, "error", error instanceof Error ? error.message : String(error));
          }
        }
        throw error;
      });
  }
  return globalThis.__qvac_modelsReadyPromise as Promise<ModelIds>;
}

/** Pre-warm all three core models. Call from instrumentation.ts or similar. */
export function warmupModels(): void {
  getModelsReady().catch(() => undefined);
}
