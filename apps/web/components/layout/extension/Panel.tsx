import { X, Download } from "lucide-react";
import Button from "@/components/ui/Button";
import { FEATURES } from "./data";
import Card from "./PanelCard";
import Steps from "./PanelSteps";
import Callout from "./PanelCallout";

type Props = {
  onClose: () => void;
};

export default function ExtensionPanel({ onClose }: Props) {
  return (
    <>
      <div className="border-border flex shrink-0 items-start justify-between border-b px-6 py-4">
        <div>
          <h2 id="ext-modal-title" className="text-foreground text-lg font-bold">
            Guardian Browser Extension
          </h2>
          <p className="text-muted mt-0.5 text-sm">
            Real-time transaction firewall inside Chrome, powered by on-device QVAC AI.
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="text-muted hover:text-foreground ml-4 shrink-0 rounded-md p-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
        >
          <X size={20} />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="space-y-6 px-6 py-5">
          <div className="grid gap-3 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <Card key={f.title} {...f} />
            ))}
          </div>
          <Steps />
          <Callout />
        </div>
      </div>

      <div className="border-border bg-surface flex shrink-0 flex-col gap-2 border-t px-6 py-4 sm:flex-row sm:items-center sm:justify-end">
        <Button variant="secondary" size="md" onClick={onClose}>
          Close
        </Button>
        <a href="/api/extension-download" download="guardian-wallet-extension.zip">
          <Button size="md" className="w-full sm:w-auto">
            <Download size={15} />
            Download extension ZIP
          </Button>
        </a>
      </div>
    </>
  );
}
