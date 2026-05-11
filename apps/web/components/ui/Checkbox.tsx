import type { InputHTMLAttributes } from "react";
import { Check } from "lucide-react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
  description?: string;
};

export default function Checkbox({ label, description, className = "", id, ...props }: Props) {
  return (
    <label className={`group flex cursor-pointer gap-3 ${className}`.trimEnd()}>
      <input type="checkbox" id={id} className="peer sr-only" {...props} />

      <span
        aria-hidden="true"
        className="border-border bg-surface peer-checked:border-primary peer-checked:bg-primary peer-focus-visible:ring-primary group-hover:border-primary mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors duration-150 peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-offset-1 peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
      >
        <Check className="text-primary-fg h-2.5 w-2.5" strokeWidth={2.5} aria-hidden="true" />
      </span>

      <span className="select-none text-xs">
        <span className="text-foreground block font-medium">{label}</span>
        {description && <span className="text-muted">{description}</span>}
      </span>
    </label>
  );
}
