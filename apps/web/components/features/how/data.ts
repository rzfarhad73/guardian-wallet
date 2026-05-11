import { FileSearch, ScanSearch, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type Tool = {
  icon: LucideIcon;
  iconSize: number;
  title: string;
  description: string;
  details: readonly string[];
};

export const TOOLS: Tool[] = [
  {
    icon: FileSearch,
    iconSize: 24,
    title: "Transaction Analyzer",
    description:
      "Paste a base64-encoded transaction or a mainnet signature. Guardian parses every instruction (programs invoked, token transfers, delegate approvals, authority changes) and scores risk deterministically before the LLM explains it.",
    details: [
      "Supports pre-sign, sender, recipient, and viewer contexts",
      "Intent firewall: declare what you expect the tx to do. Guardian flags any mismatch.",
      "Scam text in memos detected via local pattern matching",
      "Risk score 0–100 with Low / Medium / High / Critical levels"
    ]
  },
  {
    icon: ScanSearch,
    iconSize: 24,
    title: "Screenshot Scanner",
    description:
      "Upload a screenshot or paste text from a suspicious popup, message, or wallet prompt. QVAC OCR extracts text locally, a local knowledge base matches known scam patterns, and the LLM explains the threat.",
    details: [
      "QVAC OCR runs fully on-device. Your image never leaves your machine.",
      "Local RAG knowledge base of scam patterns and phishing tactics",
      "Detects seed phrase requests, fake validation prompts, support scams",
      "Works on screenshots, copy-pasted messages, and DM text"
    ]
  },
  {
    icon: Wallet,
    iconSize: 24,
    title: "Wallet Profile",
    description:
      "Enter any Solana address to fetch its on-chain facts: SOL balance, all token accounts, active delegates, and recent transaction count. Risk rules run deterministically. The LLM only explains funded wallets with real data.",
    details: [
      "Active delegate detection (the primary wallet drainer mechanism)",
      "One-click Revoke transaction built and sent via Phantom",
      "Dust/spam token detection and low-SOL fee warnings",
      "Never-funded addresses return a deterministic explanation, no LLM hallucination"
    ]
  }
];

export type PipelineStep = {
  step: string;
  title: string;
  text: string;
};

export const PIPELINE: PipelineStep[] = [
  {
    step: "1",
    title: "Deterministic parsing",
    text: "Programs, transfers, approvals, authority changes, and wallet facts are extracted with no AI, just code. This produces structured evidence that cannot be hallucinated."
  },
  {
    step: "2",
    title: "Risk rule engine",
    text: "Rules score the evidence 0–100 and produce findings with severity, score impact, and evidence strings. The score is final. The LLM cannot change it."
  },
  {
    step: "3",
    title: "QVAC local LLM",
    text: "Structured facts and deterministic findings are passed to a local Llama 3.2 1B model via QVAC. It explains risk in plain English, grounded only in what was found."
  },
  {
    step: "4",
    title: "Post-processing guardrails",
    text: "Confidence and suggested action are anchored to the deterministic score — the LLM cannot recommend signing a Critical transaction. The AI explanation is only replaced when it is missing, too short, or contradicts a clear finding."
  }
];

export type RiskLevel = {
  label: string;
  range: string;
  color: string;
  bar: string;
  width: string;
  desc: string;
};

export const RISK_LEVELS: RiskLevel[] = [
  {
    label: "Low",
    range: "0–24",
    color: "text-safe-fg",
    bar: "bg-safe-fg",
    width: "w-1/4",
    desc: "No significant risk signals found."
  },
  {
    label: "Medium",
    range: "25–49",
    color: "text-warn-fg",
    bar: "bg-warn-fg",
    width: "w-2/4",
    desc: "Review carefully before proceeding."
  },
  {
    label: "High",
    range: "50–79",
    color: "text-danger",
    bar: "bg-danger",
    width: "w-3/4",
    desc: "Serious risk signals present."
  },
  {
    label: "Critical",
    range: "80–100",
    color: "text-critical",
    bar: "bg-critical",
    width: "w-full",
    desc: "Do not sign. Treat as compromised."
  }
];

export type PrivacyRow = {
  label: string;
  value: string;
};

export const PRIVACY_ROWS: PrivacyRow[] = [
  { label: "Wallet addresses", value: "Queried via public Solana RPC — a network call, not cloud AI" },
  {
    label: "Transaction data",
    value: "Raw bytes are decoded locally; signature lookup fetches public data via RPC"
  },
  { label: "Screenshots / images", value: "OCR runs fully on-device via QVAC" },
  { label: "AI explanations", value: "Local Llama 3.2 via QVAC — no API keys, no cloud AI" },
  { label: "Scam pattern matching", value: "Local vector embeddings via QVAC, no cloud search" },
  { label: "Seed phrases / keys", value: "Never requested, never accepted" }
];

export const LIMITATIONS: string[] = [
  "Guardian cannot detect zero-day exploits or novel attack vectors not in its rule set",
  "The local LLM is small (1B parameters) and may miss nuance. Always read the deterministic findings too.",
  "Wallet profile data is as current as the Solana RPC. Recheck before acting on delegate revocations.",
  "Guardian is not a substitute for independent transaction verification"
];
