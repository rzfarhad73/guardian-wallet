import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        foreground: "var(--color-foreground)",
        muted: "var(--color-muted)",
        surface: "var(--color-surface)",
        "surface-raised": "var(--color-surface-raised)",
        "surface-hover": "var(--color-surface-hover)",
        background: "var(--color-background)",
        border: "var(--color-border)",
        primary: "var(--color-primary)",
        "primary-fg": "var(--color-primary-fg)",
        "warn-fg": "var(--color-warn-fg)",
        "warn-label": "var(--color-warn-label)",
        "safe-fg": "var(--color-safe-fg)",
        danger: "var(--color-danger)",
        critical: "var(--color-critical)",
        "qvac-active": "var(--qvac-active-border)"
      },
      boxShadow: {
        soft: "var(--shadow-panel)"
      }
    }
  },
  plugins: []
};

export default config;
