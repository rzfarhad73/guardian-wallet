import Card from "@/components/ui/Card";
import { LIMITATIONS } from "./data";

export default function Limitations() {
  return (
    <Card>
      <h3 className="text-foreground text-xl font-semibold">What Guardian can&apos;t do</h3>
      <p className="text-muted mt-2 text-sm leading-6">
        Understanding the limits builds better habits than false confidence.
      </p>
      <ul className="mt-4 space-y-2">
        {LIMITATIONS.map((l) => (
          <li key={l} className="text-muted flex items-start gap-2 text-sm leading-6">
            <span className="text-danger mt-0.5 shrink-0 font-bold">×</span>
            {l}
          </li>
        ))}
      </ul>
    </Card>
  );
}
