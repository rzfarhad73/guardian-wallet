import { useEffect, useRef, useState } from "react";
import { Upload } from "lucide-react";

interface InputUploadProps {
  id: string;
  label: string;
  accept?: string;
  onChange: (file: File | undefined) => void;
  preview?: string;
  previewAlt?: string;
  className?: string;
}

function isAccepted(file: File, accept: string): boolean {
  return accept.split(",").some((token) => {
    const t = token.trim();
    if (t.startsWith(".")) return file.name.toLowerCase().endsWith(t.toLowerCase());
    if (t.endsWith("/*")) return file.type.startsWith(t.slice(0, -1));
    return file.type === t;
  });
}

export default function InputUpload({
  id,
  label,
  accept,
  onChange,
  preview,
  previewAlt = "Upload preview",
  className = ""
}: InputUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [typeError, setTypeError] = useState("");

  useEffect(() => {
    if (preview) setTypeError("");
  }, [preview]);

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    if (accept && !isAccepted(file, accept)) {
      setTypeError(`"${file.name}" is not a supported image file. Please upload a PNG, JPEG, WebP, or SVG.`);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setTypeError("");
    onChange(file);
  }

  function handleDrop(event: React.DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    handleFiles(event.dataTransfer.files);
  }

  return (
    <div className={`min-w-0 overflow-hidden ${className}`}>
      <span className="text-foreground block text-sm font-medium">{label}</span>
      <label
        htmlFor={id}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={[
          "border-border bg-surface text-muted mt-2 flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed px-4 py-6 text-sm transition-colors",
          dragging ? "border-primary bg-primary/5" : "hover:border-primary/50"
        ].join(" ")}
      >
        <Upload size={20} className="opacity-50" />
        <span>
          Drag & drop or <span className="text-primary font-medium">browse</span>
        </span>
        {accept && (
          <span className="break-all text-center text-xs opacity-50">{accept.split(",").join(" · ")}</span>
        )}
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </label>

      {typeError && <p className="text-warn-fg mt-2 text-xs">{typeError}</p>}

      {!typeError && preview ? (
        <img
          src={preview}
          alt={previewAlt}
          className="border-border mt-4 max-h-72 w-full rounded-md border object-contain"
        />
      ) : !typeError ? (
        <div className="border-border bg-surface text-muted mt-4 flex h-44 items-center justify-center rounded-md border border-dashed text-sm">
          Preview
        </div>
      ) : null}
    </div>
  );
}
