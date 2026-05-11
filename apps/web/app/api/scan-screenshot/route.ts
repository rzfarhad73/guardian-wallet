import { NextResponse } from "next/server";
import { buildScreenshotPrompt } from "@/lib/risk/explanationPrompt";
import { evaluateScamText } from "@/lib/risk/scamSignals";
import { normalizeCryptoTerms } from "@/lib/risk/normalizeCryptoTerms";
import { scoreFindings, ragMatchesToFindings } from "@/lib/risk/scoreRisk";
import { generateGuardianExplanation } from "@/lib/qvac/llm";
import { extractTextWithQvac } from "@/lib/qvac/ocr";
import { translateToEnglish } from "@/lib/qvac/translation";
import { getQvacClient } from "@/lib/qvac/qvacClient";
import { searchScamPatterns } from "@/lib/qvac/rag";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_TEXT_CHARS = 12_000;
const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    const qvac = getQvacClient();
    let extractedText = "";
    let blocks: unknown[] | undefined;
    let ocrError: string | undefined;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("image");
      if (file instanceof Blob && file.size > 0) {
        if (file.size > MAX_IMAGE_BYTES) {
          return NextResponse.json({ error: "Image too large. Maximum size is 10 MB." }, { status: 413 });
        }
        if (file.type && !ALLOWED_IMAGE_TYPES.has(file.type)) {
          return NextResponse.json(
            { error: "Unsupported image type. Use PNG, JPEG, WebP, or GIF." },
            { status: 415 }
          );
        }
        try {
          const ocr = await extractTextWithQvac(qvac, file);
          extractedText = ocr.text;
          blocks = ocr.blocks;
        } catch (error) {
          ocrError = error instanceof Error ? error.message : "QVAC OCR failed for this image.";
          extractedText = "";
        }
      } else {
        extractedText = "";
      }
    } else {
      const body = (await request.json()) as { text?: string };
      extractedText = body.text ?? "";
      if (extractedText.length > MAX_TEXT_CHARS) {
        return NextResponse.json(
          { error: `Text too large. Maximum length is ${MAX_TEXT_CHARS.toLocaleString()} characters.` },
          { status: 413 }
        );
      }
    }

    if (!extractedText.trim()) {
      throw new Error("Upload a screenshot or choose a sample scam text.");
    }

    let detectedLanguage: string | undefined;
    let translatedText: string | undefined;
    let wasTranslated = false;
    try {
      const translation = await translateToEnglish(qvac, extractedText);
      detectedLanguage = translation.detectedLanguage;
      wasTranslated = translation.wasTranslated;
      if (wasTranslated) {
        translatedText = translation.translatedText;
      }
    } catch {
      // translation is best-effort — proceed with original text
    }

    const translationUnavailable = !!(
      detectedLanguage &&
      detectedLanguage !== "en" &&
      detectedLanguage !== "unknown" &&
      !wasTranslated
    );

    const textForAnalysis = normalizeCryptoTerms(translatedText ?? extractedText);
    const findings = evaluateScamText(textForAnalysis);
    const matches = await searchScamPatterns(qvac, textForAnalysis, 5);
    const allFindings = [...findings, ...ragMatchesToFindings(matches, findings)];
    const assessment = scoreFindings(allFindings);

    let explanation: Awaited<ReturnType<typeof generateGuardianExplanation>> | null = null;
    let llmError: string | undefined;
    try {
      explanation = await generateGuardianExplanation(
        qvac,
        buildScreenshotPrompt(textForAnalysis, findings, matches, assessment),
        assessment,
        "screenshot",
        { findings: allFindings, matches }
      );
    } catch (llmErr) {
      llmError = llmErr instanceof Error ? llmErr.message : "LLM unavailable — retry in a moment.";
    }

    // Sanitize the OCR text shown to the user so they see the same cleaned-up
    // representation that was passed to the analysis pipeline, not raw OCR noise.
    const sanitizedOcrText = normalizeCryptoTerms(extractedText);

    return NextResponse.json({
      mode: qvac.mode,
      extractedText: sanitizedOcrText,
      blocks,
      ocrError,
      llmError,
      detectedLanguage,
      translatedText,
      wasTranslated,
      translationUnavailable,
      matches,
      findings: allFindings,
      assessment,
      explanation
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to scan screenshot."
      },
      { status: 400 }
    );
  }
}
