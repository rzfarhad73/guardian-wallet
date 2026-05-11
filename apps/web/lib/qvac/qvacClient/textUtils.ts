/** Returns true when OCR blocks look like garbage from a wrong-script recogniser. */
export function looksLikeGarbageOcr(text: string, blocks?: Array<{ confidence?: number }>): boolean {
  if (!text.trim()) return false;

  const confidences = (blocks ?? []).map((b) => b.confidence).filter((c): c is number => c !== undefined);

  if (confidences.length > 0) {
    const mean = confidences.reduce((a, b) => a + b, 0) / confidences.length;
    if (mean < 0.45) return true;
  }

  const noiseChars = (text.match(/[#@*'"\\[\](){}|<>^~`]/g) ?? []).length;
  const total = text.replace(/\s/g, "").length;
  if (total > 0 && noiseChars / total > 0.08) return true;

  // Detect Cyrillic-as-Latin OCR confusion: digits embedded inside alphabetic words
  // (e.g. З→3, б→6 produce "3a6nokupoBah", "6yAYT", "nogo3putenbhaq").
  // If >15% of multi-character words contain a digit flanked by letters, it's a Cyrillic image.
  const words = text.match(/\b[a-zA-Z0-9]{3,}\b/g) ?? [];
  if (words.length >= 4) {
    const confused = words.filter((w) => /[a-zA-Z]\d[a-zA-Z]|\d[a-zA-Z]{2}|[a-zA-Z]{2}\d/.test(w)).length;
    if (confused / words.length > 0.15) return true;
  }

  return false;
}

export function detectScriptLanguage(text: string): string {
  let cyrillic = 0,
    cjk = 0,
    arabic = 0,
    devanagari = 0,
    hangul = 0,
    kana = 0;
  for (const ch of text) {
    const cp = ch.codePointAt(0) ?? 0;
    if (cp >= 0x0400 && cp <= 0x04ff) cyrillic++;
    else if (cp >= 0x4e00 && cp <= 0x9fff) cjk++;
    else if (cp >= 0x0600 && cp <= 0x06ff) arabic++;
    else if (cp >= 0x0900 && cp <= 0x097f) devanagari++;
    else if ((cp >= 0xac00 && cp <= 0xd7ff) || (cp >= 0x1100 && cp <= 0x11ff)) hangul++;
    else if ((cp >= 0x3040 && cp <= 0x309f) || (cp >= 0x30a0 && cp <= 0x30ff)) kana++;
  }

  const dominantCount = Math.max(cyrillic, cjk, arabic, devanagari, hangul, kana);
  if (dominantCount < 3) {
    // Turkish-specific letters
    if (/[ıİğĞşŞ]/.test(text)) return "tr";
    // Spanish diacritics
    if (/[áéíóúñ¿¡]/i.test(text)) return "es";
    // Diacritic-free Spanish (OCR output that loses accents — require 2+ indicator words)
    const spanishHits = (
      text.match(
        /\b(?:cartera|semilla|billetera|verificar|fondos|transferencia|recibir|enviar|conectar|ingresa|transaccion|solicite|seleccionados|frase)\b/gi
      ) ?? []
    ).length;
    if (spanishHits >= 2) return "es";
    return "en";
  }

  if (cyrillic === dominantCount) return "ru";
  if (cjk === dominantCount) return "zh";
  if (arabic === dominantCount) return "ar";
  if (devanagari === dominantCount) return "hi";
  if (hangul === dominantCount) return "ko";
  if (kana === dominantCount) return "ja";
  return "en";
}

export async function toBuffer(image: File | Blob | ArrayBuffer | Buffer): Promise<Buffer> {
  if (Buffer.isBuffer(image)) return image;
  if (image instanceof ArrayBuffer) return Buffer.from(image);
  return Buffer.from(await image.arrayBuffer());
}
