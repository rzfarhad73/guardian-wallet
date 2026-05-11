import Card from "@/components/ui/Card";
import QvacBadge from "@/components/ui/QvacBadge";

const LANG_NAMES: Record<string, string> = {
  ar: "Arabic",
  de: "German",
  es: "Spanish",
  fr: "French",
  hi: "Hindi",
  it: "Italian",
  ja: "Japanese",
  ko: "Korean",
  pt: "Portuguese",
  ru: "Russian",
  tr: "Turkish",
  vi: "Vietnamese",
  zh: "Chinese"
};

export default function ResultsOcr({
  extractedText,
  mode,
  ocrError,
  loading,
  detectedLanguage,
  translatedText,
  wasTranslated,
  textMode = false
}: {
  extractedText?: string;
  mode?: string;
  ocrError?: string;
  loading?: boolean;
  detectedLanguage?: string;
  translatedText?: string;
  wasTranslated?: boolean;
  textMode?: boolean;
}) {
  const langLabel = detectedLanguage
    ? (LANG_NAMES[detectedLanguage] ?? detectedLanguage.toUpperCase())
    : null;

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-foreground text-base font-semibold sm:text-lg">
          {textMode ? "Message text" : "Extracted OCR text"}
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          {!textMode && mode ? (
            <QvacBadge
              active={mode === "qvac" && !ocrError}
              activeLabel="QVAC OCR: Active"
              inactiveLabel="Mock AI"
            />
          ) : null}
          {wasTranslated ? (
            <QvacBadge
              active={true}
              activeLabel={`QVAC Translation: ${langLabel ?? "detected"} → EN`}
              inactiveLabel="Translation off"
            />
          ) : detectedLanguage && detectedLanguage !== "en" && detectedLanguage !== "unknown" ? (
            <QvacBadge
              active={false}
              activeLabel=""
              inactiveLabel={`${langLabel ?? detectedLanguage} detected — no offline model`}
            />
          ) : null}
        </div>
      </div>
      {ocrError ? (
        <p className="ocr-warn-box mt-2 rounded-md border px-3 py-2 text-xs">
          OCR fallback used for this sample asset: {ocrError}
        </p>
      ) : null}
      {loading ? (
        <div className="mt-3 animate-pulse space-y-2">
          <div className="bg-border h-3 w-full rounded" />
          <div className="bg-border h-3 w-5/6 rounded" />
          <div className="bg-border h-3 w-4/6 rounded" />
          <div className="bg-border h-3 w-full rounded" />
        </div>
      ) : wasTranslated ? (
        <div className="mt-3 space-y-3">
          <div>
            <p className="text-muted mb-1 text-xs font-medium uppercase tracking-wide">
              Original ({langLabel ?? detectedLanguage})
            </p>
            <div className="max-h-40 overflow-y-auto rounded-md">
              <p className="text-foreground whitespace-pre-wrap text-sm opacity-70">{extractedText}</p>
            </div>
          </div>
          <div>
            <p className="text-muted mb-1 text-xs font-medium uppercase tracking-wide">
              Translated to English
            </p>
            <div className="max-h-40 overflow-y-auto rounded-md">
              <p className="text-foreground whitespace-pre-wrap text-sm">{translatedText}</p>
            </div>
          </div>
        </div>
      ) : detectedLanguage && detectedLanguage !== "en" && detectedLanguage !== "unknown" ? (
        // Language detected but no offline model available for it
        <div className="mt-3 space-y-3">
          <div>
            <p className="text-muted mb-1 text-xs font-medium uppercase tracking-wide">
              Original ({langLabel ?? detectedLanguage})
            </p>
            <div className="max-h-40 overflow-y-auto rounded-md">
              <p className="text-foreground whitespace-pre-wrap text-sm">{extractedText}</p>
            </div>
          </div>
          <p className="text-muted text-xs italic">
            Offline translation is not yet available for {langLabel ?? detectedLanguage}. Risk analysis ran on
            the original text.
          </p>
        </div>
      ) : (
        <div className="mt-3 max-h-52 overflow-y-auto rounded-md">
          <p className="text-foreground whitespace-pre-wrap text-sm">
            {extractedText ?? "OCR output will appear here."}
          </p>
        </div>
      )}
    </Card>
  );
}
