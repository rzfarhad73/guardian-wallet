/** Shape of the raw @qvac/sdk module as consumed by qvacClient. */
export type QvacSdk = {
  [key: string]: unknown;
  loadModel: (options: unknown) => Promise<string>;
  completion: (params: unknown) => { text: Promise<string> };
  ocr: (params: unknown) => {
    blocks: Promise<Array<{ text: string; confidence?: number; bbox?: number[] }>>;
  };
  embed: (params: { modelId: string; text: string }) => Promise<{ embedding: number[] }>;
  translate: (params: {
    modelId: string;
    text: string | string[];
    stream: boolean;
    modelType: "nmtcpp-translation";
  }) => { text: Promise<string> };
};

export type CapabilityKey = "llm" | "ocr" | "embeddings" | "translation";

export type ModelIds = { embedding: string; llm: string; ocr: string };
