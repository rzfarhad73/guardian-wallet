import { Shield, Zap, WifiOff, MonitorCheck } from "lucide-react";

export const FEATURES = [
  {
    icon: Shield,
    title: "Intercepts before you sign",
    description:
      "Hooks into dApp transaction requests before they reach Phantom. If a transaction is risky, Guardian shows an overlay with findings and a Cancel option."
  },
  {
    icon: Zap,
    title: "On-device analysis only",
    description:
      "The extension forwards transactions to the Guardian server on your machine. All AI inference runs locally via QVAC — no cloud AI is used. Wallet profile lookups use the public Solana RPC."
  },
  {
    icon: WifiOff,
    title: "Fail-open safety",
    description:
      "If the Guardian server is not running, the extension steps aside silently and transactions proceed normally. It never blocks your workflow."
  },
  {
    icon: MonitorCheck,
    title: "Low-risk transactions are skipped",
    description:
      "Transactions that score Low risk pass through without interruption. Only Medium, High, and Critical results show the overlay."
  }
];

export const STEPS = [
  { n: 1, text: "Download the ZIP file below and extract it to a folder on your computer." },
  { n: 2, text: "Open Chrome and go to chrome://extensions" },
  { n: 3, text: "Enable Developer mode (toggle in the top-right corner)." },
  { n: 4, text: 'Click "Load unpacked" and select the extracted extension folder.' },
  {
    n: 5,
    text: "Make sure the Guardian server is running locally (npm run dev at localhost:3000) before using the extension."
  }
];
