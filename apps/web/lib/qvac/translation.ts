import type { QvacClient } from "./types";

/**
 * Translates text to English using QVAC's offline NMT engine (@qvac/translation-nmtcpp).
 * Falls back gracefully — if translation fails or the text is already English,
 * the original text is returned with wasTranslated=false.
 */
export async function translateToEnglish(
  qvac: QvacClient,
  text: string
): Promise<{ translatedText: string; detectedLanguage: string; wasTranslated: boolean }> {
  return qvac.translation.translate({ text, targetLang: "en" });
}
