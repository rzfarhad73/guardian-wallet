import type { SVGProps } from "react";

interface LogoProps {
  variant?: "icon" | "full";
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  xs: { icon: 18, textClass: "text-xs" },
  sm: { icon: 22, textClass: "text-sm" },
  md: { icon: 28, textClass: "text-base" },
  lg: { icon: 36, textClass: "text-xl" }
} as const;

export default function Logo({ variant = "full", size = "md", className }: LogoProps) {
  const { icon, textClass } = sizes[size];
  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <GuardianIcon width={icon} height={icon} />
      {variant === "full" && (
        <span className={`text-foreground font-bold tracking-tight ${textClass}`}>Guardian</span>
      )}
    </div>
  );
}

export function GuardianIcon({ width = 28, height = 28, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      role="img"
      {...props}
    >
      <path
        d="M12 2C12 2 4 5 4 5.8V12.5C4 17.5 7.5 21.8 12 23.2C16.5 21.8 20 17.5 20 12.5V5.8C20 5 12 2 12 2Z"
        fill="var(--color-primary)"
      />

      <path
        d="M7 12.5C8.5 10.2 10 9.2 12 9.2C14 9.2 15.5 10.2 17 12.5C15.5 14.8 14 15.8 12 15.8C10 15.8 8.5 14.8 7 12.5Z"
        fill="white"
        fillOpacity="0.16"
      />

      <line x1="7" y1="12.5" x2="17" y2="12.5" stroke="white" strokeWidth="0.45" strokeOpacity="0.45" />

      <circle cx="12" cy="12.5" r="2.2" fill="white" fillOpacity="0.9" />

      <circle cx="12" cy="12.5" r="0.88" fill="var(--color-primary)" />

      <circle cx="9" cy="12.5" r="0.42" fill="white" fillOpacity="0.58" />
      <circle cx="15" cy="12.5" r="0.42" fill="white" fillOpacity="0.58" />
    </svg>
  );
}
