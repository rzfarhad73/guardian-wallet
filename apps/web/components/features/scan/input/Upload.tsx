import { ImageUp } from "lucide-react";
import InputUpload from "@/components/ui/InputUpload";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import ErrorMessage from "@/components/ui/ErrorMessage";
import RateLimitRetry from "@/components/ui/RateLimitRetry";

type Props = {
  file?: File;
  preview: string;
  loading: boolean;
  error: string;
  statusCode?: number;
  onFileChange: (file?: File) => void;
  onScanUpload: () => void;
  onRetry: () => void;
};

export default function InputUploadCard({
  file,
  preview,
  loading,
  error,
  statusCode,
  onFileChange,
  onScanUpload,
  onRetry
}: Props) {
  return (
    <Card>
      <h2 className="text-foreground text-xl font-semibold">Scan a suspicious message or wallet popup</h2>
      <InputUpload
        id="screenshot-upload"
        label="Upload screenshot"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        onChange={onFileChange}
        preview={preview}
        previewAlt="Uploaded suspicious screenshot preview"
        className="mt-5"
      />
      <Button
        className="mt-4 w-full sm:w-auto"
        icon={ImageUp}
        loading={loading}
        onClick={onScanUpload}
        disabled={!file}
      >
        Run QVAC OCR Scan
      </Button>
      {statusCode === 429 ? (
        <RateLimitRetry onRetry={onRetry} />
      ) : error ? (
        <ErrorMessage message={error} onRetry={onRetry} />
      ) : null}
    </Card>
  );
}
