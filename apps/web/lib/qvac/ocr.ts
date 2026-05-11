import type { QvacClient } from "./types";

export async function extractTextWithQvac(qvac: QvacClient, image: File | Blob | ArrayBuffer | Buffer) {
  return qvac.ocr.extractText({ image });
}
