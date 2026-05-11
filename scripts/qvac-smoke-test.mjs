import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { close, completion, embed, loadModel, ocr, translate, unloadModel } from "@qvac/sdk";
import * as qvacSdk from "@qvac/sdk";

loadEnvFile(".env");
loadEnvFile(".env.local");

const loadedModels = [];

function loadEnvFile(path) {
  const fullPath = resolve(process.cwd(), path);
  if (!existsSync(fullPath)) return;
  const content = readFileSync(fullPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed
      .slice(index + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
    process.env[key] ??= value;
  }
}

function resolveModelSrc(envPath, presetName, fallbackPresetName) {
  if (process.env[envPath]) return process.env[envPath];
  const selectedPresetName = process.env[presetName] ?? fallbackPresetName;
  const preset = qvacSdk[selectedPresetName];
  if (!preset) {
    throw new Error(`Preset ${selectedPresetName} not found. Set ${envPath} to a local model path.`);
  }
  return preset;
}

async function loadTrackedModel(options) {
  const modelId = await loadModel(options);
  loadedModels.push(modelId);
  return modelId;
}

async function runLlmSmokeTest() {
  console.log("Loading QVAC LLM model...");
  const modelId = await loadTrackedModel({
    modelSrc: resolveModelSrc("QVAC_LLM_MODEL_SRC", "QVAC_LLM_MODEL_PRESET", "LLAMA_3_2_1B_INST_Q4_0"),
    modelType: "llamacpp-completion",
    modelConfig: {
      ctx_size: Number(process.env.QVAC_LLM_CONTEXT_SIZE ?? 4096),
      device: process.env.QVAC_DEVICE ?? "cpu",
      temp: Number(process.env.QVAC_LLM_TEMPERATURE ?? 0.2)
    }
  });

  const run = completion({
    modelId,
    stream: false,
    history: [
      {
        role: "system",
        content: "You are Guardian, a concise Solana wallet safety assistant."
      },
      {
        role: "user",
        content: "Reply with one sentence explaining why users should review token approvals before signing."
      }
    ],
    responseFormat: { type: "text" }
  });

  const text = await run.text;
  console.log("LLM OK:");
  console.log(text.trim());
}

async function runEmbeddingSmokeTest() {
  console.log("Loading QVAC embedding model...");
  const modelId = await loadTrackedModel({
    modelSrc: resolveModelSrc("QVAC_EMBED_MODEL_SRC", "QVAC_EMBED_MODEL_PRESET", "GTE_LARGE_FP16"),
    modelType: "llamacpp-embedding",
    modelConfig: {
      device: process.env.QVAC_DEVICE ?? "cpu"
    }
  });

  const { embedding } = await embed({
    modelId,
    text: "Seed phrase request scam: never enter a recovery phrase into a support form."
  });

  console.log(`Embeddings OK: vector length ${embedding.length}`);
}

async function runOcrSmokeTest() {
  // Fall back to a bundled sample image so OCR always runs in CI/demos.
  const imagePath = process.env.QVAC_TEST_IMAGE
    ? resolve(process.cwd(), process.env.QVAC_TEST_IMAGE)
    : resolve(process.cwd(), "apps/web/public/samples/06-clean-legit-transfer.png");

  console.log(`Loading QVAC OCR model... (image: ${imagePath})`);
  const modelId = await loadTrackedModel({
    modelSrc: resolveModelSrc("QVAC_OCR_MODEL_SRC", "QVAC_OCR_MODEL_PRESET", "OCR_LATIN_RECOGNIZER_1"),
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
  });

  if (!existsSync(imagePath)) {
    console.log(`OCR skipped: sample image not found at ${imagePath}`);
    return;
  }
  const { blocks } = ocr({
    modelId,
    image: imagePath,
    options: {
      paragraph: false
    }
  });
  const result = await blocks;
  console.log(`OCR OK: ${result.length} block(s)`);
  for (const block of result.slice(0, 5)) {
    console.log(`- ${block.text}`);
  }
}

async function runTranslationSmokeTest() {
  const translateEnvSrc = process.env.QVAC_TRANSLATE_MODEL_SRC;
  // The app uses per-language Bergamot presets. Try them in order until one is
  // available — the smoke test uses a Spanish sample sentence so prefer ES first.
  const CANDIDATE_PRESETS = [
    process.env.QVAC_TRANSLATE_MODEL_PRESET,
    "BERGAMOT_ES_EN",
    "BERGAMOT_RU_EN",
    "BERGAMOT_ZH_EN",
    "BERGAMOT_AR_EN",
    "BERGAMOT_TR_EN"
  ].filter(Boolean);
  const selectedPreset = CANDIDATE_PRESETS.find((presetName) => qvacSdk[presetName]);
  const translateSrc = translateEnvSrc ?? (selectedPreset ? qvacSdk[selectedPreset] : undefined);
  if (!translateSrc) {
    console.log(
      "Translation skipped: no Bergamot preset found in @qvac/sdk. Set QVAC_TRANSLATE_MODEL_SRC to test."
    );
    return;
  }
  const langMatch = selectedPreset?.match(/^BERGAMOT_([A-Z]{2})_EN$/);
  const from = process.env.QVAC_TRANSLATE_FROM ?? langMatch?.[1]?.toLowerCase() ?? "es";

  console.log("Loading QVAC translation model...");
  const modelId = await loadTrackedModel({
    modelSrc: translateSrc,
    modelType: "nmtcpp-translation",
    modelConfig: { engine: "Bergamot", from, to: "en" }
  });

  const { text: translated } = translate({
    modelId,
    text: "Tu cartera ha sido comprometida. Ingrese su frase semilla ahora.",
    stream: false,
    modelType: "nmtcpp-translation"
  });
  console.log(`Translation OK (${from} → en):`);
  console.log((await translated).trim());
}

try {
  console.log("QVAC smoke test starting.");
  console.log(`Device: ${process.env.QVAC_DEVICE ?? "cpu"}`);
  await runLlmSmokeTest();
  await runEmbeddingSmokeTest();
  await runOcrSmokeTest();
  await runTranslationSmokeTest();
  console.log("QVAC smoke test complete.");
} catch (error) {
  console.error("QVAC smoke test failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  for (const modelId of loadedModels.reverse()) {
    await unloadModel({ modelId, clearStorage: false }).catch(() => undefined);
  }
  await close().catch(() => undefined);
}
