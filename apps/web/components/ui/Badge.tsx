import type { ReactNode } from "react";

export type BadgeVariant = "critical" | "high" | "medium" | "low" | "neutral";

const variantClass: Record<BadgeVariant, string> = {
  critical: "badge-critical",
  high: "badge-high",
  medium: "badge-medium",
  low: "badge-low",
  neutral: "badge-neutral"
};

export default function Badge({
  variant = "neutral",
  className,
  children
}: {
  variant?: BadgeVariant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={`rounded-full border px-2 py-1 text-xs font-semibold uppercase ${variantClass[variant]} ${className ?? ""}`.trimEnd()}
    >
      {children}
    </span>
  );
}
