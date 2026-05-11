import type { RefObject } from "react";
import Card from "@/components/ui/Card";
import Explanation from "@/components/features/risk/Explanation";
import Reasons from "@/components/features/risk/Reasons";
import Score from "@/components/features/risk/Score";
import ResultsOcr from "./Ocr";
import Rag from "@/components/features/risk/Rag";
import type { ScanResult } from "../types";

const LANGUAGE_NAMES: Record<string, string> = {
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
  zh: "Chinese"
};

type Props = {
  result?: ScanResult;
  loading: boolean;
  lastAction: "upload" | "text" | null;
  resultsRef: RefObject<HTMLElement | null>;
};

export default function Results({ result, loading, lastAction, resultsRef }: Props) {
  return (
    <section ref={resultsRef} className="min-w-0 space-y-6">
      {result?.translationUnavailable ? (
        <>
          <ResultsOcr
            extractedText={result.extractedText}
            mode={result.mode}
            ocrError={result.ocrError}
            detectedLanguage={result.detectedLanguage}
            wasTranslated={false}
            textMode={lastAction === "text"}
          />
          <Card>
            <p className="text-foreground text-sm font-medium">Analysis not available</p>
            <p className="text-muted mt-2 text-sm">
              Guardian detected this message is written in{" "}
              <span className="font-medium">
                {result.detectedLanguage
                  ? (LANGUAGE_NAMES[result.detectedLanguage] ?? result.detectedLanguage.toUpperCase())
                  : "an unsupported language"}
              </span>
              , but no offline translation model is available for it. To maintain accuracy, Guardian does not
              analyse messages it cannot read. Please translate the message to English and paste it into the
              text scanner.
            </p>
          </Card>
        </>
      ) : (
        <>
          <Score assessment={result?.assessment} loading={loading} />
          <ResultsOcr
            extractedText={result?.extractedText}
            mode={result?.mode}
            ocrError={result?.ocrError}
            loading={loading}
            detectedLanguage={result?.detectedLanguage}
            translatedText={result?.translatedText}
            wasTranslated={result?.wasTranslated}
            textMode={lastAction === "text"}
          />
          <Rag matches={result?.matches} mode={result?.mode} loading={loading} />
          <Reasons findings={result?.findings} loading={loading} />
          {result?.llmError && (
            <p className="text-warn-fg bg-warn-bg border-warn-border rounded-md border px-3 py-2 text-xs">
              LLM explanation unavailable: {result.llmError}. Retry the scan.
            </p>
          )}
          <Explanation
            explanation={result?.explanation ?? undefined}
            mode={result?.mode}
            title="Screenshot analysis"
            loading={loading}
          />
        </>
      )}
    </section>
  );
}
