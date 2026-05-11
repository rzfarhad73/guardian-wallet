import type { ReactNode } from "react";

export default function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`shadow-soft border-border bg-surface min-w-0 overflow-hidden rounded-lg border p-4 sm:p-5 ${className}`}
    >
      {children}
    </div>
  );
}
