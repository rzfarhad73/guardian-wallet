import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type Variant = "primary" | "secondary";
type Size = "sm" | "md" | "lg";
type IconPosition = "leading" | "trailing";

const variantClass: Record<Variant, string> = {
  primary: "bg-primary text-primary-fg disabled:opacity-60",
  secondary: "border border-border bg-surface text-foreground hover:bg-surface-hover disabled:opacity-60"
};

const sizeClass: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-4 text-sm"
};

const iconSizeMap: Record<Size, number> = {
  sm: 13,
  md: 15,
  lg: 18
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: LucideIcon;
  iconPosition?: IconPosition;
  children: ReactNode;
};

function Spinner({ size, variant }: { size: number; variant: Variant }) {
  return (
    <span role="status">
      <svg
        className={`animate-spin ${variant === "secondary" ? "text-primary" : ""}`}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <span className="sr-only">Loading</span>
    </span>
  );
}

export default function Button({
  variant = "primary",
  size = "lg",
  loading = false,
  icon: Icon,
  iconPosition = "leading",
  className = "",
  type = "button",
  disabled,
  children,
  ...props
}: Props) {
  const iconPx = iconSizeMap[size];

  return (
    <button
      type={type}
      disabled={disabled ?? loading}
      className={`focus-visible:ring-primary inline-flex items-center justify-center gap-2 rounded-md font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${variantClass[variant]} ${sizeClass[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <Spinner size={iconPx} variant={variant} />
      ) : (
        <>
          {Icon && iconPosition === "leading" && <Icon size={iconPx} aria-hidden />}
          {children}
          {Icon && iconPosition === "trailing" && <Icon size={iconPx} aria-hidden />}
        </>
      )}
    </button>
  );
}
