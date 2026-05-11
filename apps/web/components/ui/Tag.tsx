import type { ReactNode } from "react";

export type TagVariant = "scam" | "safe" | "neutral";

const variantClass: Record<TagVariant, string> = {
  scam: "border-[var(--badge-critical-border)] text-[var(--badge-critical-fg)] hover:bg-[var(--badge-critical-bg)]",
  safe: "border-[var(--badge-low-border)] text-[var(--badge-low-fg)] hover:bg-[var(--badge-low-bg)]",
  neutral:
    "border-[var(--badge-neutral-border)] text-[var(--badge-neutral-fg)] hover:bg-[var(--badge-neutral-bg)]"
};

export default function Tag({
  variant = "neutral",
  onClick,
  title,
  className,
  children
}: {
  variant?: TagVariant;
  onClick?: () => void;
  title?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${variantClass[variant]} ${className ?? ""}`.trimEnd()}
    >
      {children}
    </button>
  );
}
