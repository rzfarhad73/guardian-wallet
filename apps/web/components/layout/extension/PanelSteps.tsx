import { STEPS } from "./data";

function Step({ n, text }: { n: number; text: string }) {
  return (
    <li className="flex gap-3">
      <span className="bg-primary text-primary-fg mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold">
        {n}
      </span>
      <span className="text-muted text-sm leading-relaxed">{text}</span>
    </li>
  );
}

export default function Steps() {
  return (
    <div>
      <h3 className="text-foreground mb-3 text-sm font-semibold">How to install</h3>
      <ol className="space-y-2.5">
        {STEPS.map((s) => (
          <Step key={s.n} {...s} />
        ))}
      </ol>
    </div>
  );
}
