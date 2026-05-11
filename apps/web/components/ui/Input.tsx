import type { InputHTMLAttributes } from "react";

type Variant = "default" | "mono";
type Size = "sm" | "md";

const variantClass: Record<Variant, string> = {
  default: "",
  mono: "font-mono"
};

const sizeClass: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-3 py-2 text-sm"
};

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  variant?: Variant;
  size?: Size;
};

export default function Input({ variant = "default", size = "md", className = "", ...props }: Props) {
  return (
    <input
      className={`border-border bg-surface text-foreground w-full rounded-md border ${sizeClass[size]} ${variantClass[variant]} ${className}`}
      {...props}
    />
  );
}
