import Card from "@/components/ui/Card";
import Tag from "@/components/ui/Tag";
import { SAMPLES } from "../data";

type Props = {
  onLoadSample: (filename: string) => void;
};

export default function InputSamples({ onLoadSample }: Props) {
  return (
    <Card>
      <p className="text-foreground text-sm font-medium">Sample images</p>
      <p className="text-muted mt-1 text-xs">Load a pre-built test image into the scanner above.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {SAMPLES.map((s) => (
          <Tag key={s.file} variant={s.scam ? "scam" : "safe"} onClick={() => onLoadSample(s.file)}>
            {s.label}
          </Tag>
        ))}
      </div>
    </Card>
  );
}
