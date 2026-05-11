import InputUploadCard from "./Upload";
import InputSamples from "./Samples";
import InputText from "./Text";

type Props = {
  file?: File;
  preview: string;
  pastedText: string;
  loading: boolean;
  error: string;
  statusCode?: number;
  lastAction: "upload" | "text" | null;
  onFileChange: (file?: File) => void;
  onLoadSample: (filename: string) => void;
  onPastedTextChange: (text: string) => void;
  onScanUpload: () => void;
  onScanText: () => void;
  onRetry: () => void;
};

export default function Input({
  file,
  preview,
  pastedText,
  loading,
  error,
  statusCode,
  lastAction,
  onFileChange,
  onLoadSample,
  onPastedTextChange,
  onScanUpload,
  onScanText,
  onRetry
}: Props) {
  const uploadLoading = loading && lastAction === "upload";
  const textLoading = loading && lastAction === "text";
  const uploadError = lastAction === "upload" ? error : "";
  const textError = lastAction === "text" ? error : "";
  const uploadStatusCode = lastAction === "upload" ? statusCode : undefined;
  const textStatusCode = lastAction === "text" ? statusCode : undefined;

  return (
    <section className="min-w-0 space-y-6">
      <InputUploadCard
        file={file}
        preview={preview}
        loading={uploadLoading}
        error={uploadError}
        statusCode={uploadStatusCode}
        onFileChange={onFileChange}
        onScanUpload={onScanUpload}
        onRetry={onRetry}
      />
      <InputSamples onLoadSample={onLoadSample} />
      <InputText
        pastedText={pastedText}
        loading={textLoading}
        error={textError}
        statusCode={textStatusCode}
        onPastedTextChange={onPastedTextChange}
        onScanText={onScanText}
        onRetry={onRetry}
      />
    </section>
  );
}
