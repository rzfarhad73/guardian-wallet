import { PHASE_STATUS } from "./types";
import type { Phase } from "./types";

export const PHASES: Phase[] = [
  {
    phase: "1",
    label: "Phase 1",
    status: PHASE_STATUS.SHIPPED,
    headline: "Consumer Proof of Concept",
    milestones: [
      {
        title: "Transaction Analyzer — deterministic parser + risk scorer + QVAC LLM explanation",
        done: true
      },
      { title: "Screenshot Scanner — QVAC OCR + local RAG + QVAC LLM warning", done: true },
      { title: "Wallet Profile — on-chain facts + delegate detection + QVAC risk summary", done: true },
      {
        title: "Intent Firewall — declare what you expect the tx to do; Guardian flags mismatches",
        done: true
      },
      { title: "Action Layer — one-click unsigned revoke transaction via Phantom", done: true },
      {
        title:
          "Multilingual Scam Shield — QVAC offline translation detects and translates non-English scam text before analysis",
        done: true
      },
      { title: "PWA with offline support and service worker", done: true },
      { title: "Browser extension prototype — intercepts signing flows before confirmation", done: true },
      { title: "QVAC status dashboard — live LLM / OCR / embeddings health badges", done: true },
      {
        title:
          "Guardian Policy Engine — configurable signing policies (guardian / DAO / institutional) that block delegate approvals, authority changes, and unknown programs server-side",
        done: true
      }
    ]
  },
  {
    phase: "2",
    label: "Phase 2",
    status: PHASE_STATUS.PLANNED,
    headline: "SDK Extraction & Hardening",
    milestones: [
      { title: "Extract @guardian/risk-sdk — deterministic + QVAC pipeline as a standalone npm package" },
      { title: "Accept serialized transaction or wallet address, return structured RiskAssessment" },
      { title: "QVAC explanation layer as an optional add-on; deterministic layer works standalone" },
      { title: "Publish to npm with TypeScript types and tree-shakeable exports" },
      {
        title:
          "Browser extension hardening — stable interception across Phantom, Backpack, and Solflare signing flows"
      },
      {
        title:
          "QVAC health endpoint — report model load status, last inference result, and error reason separately from configuration"
      },
      { title: "Action Layer expansion — close dust token accounts, block high-risk signing flows" }
    ]
  },
  {
    phase: "3",
    label: "Phase 3",
    status: PHASE_STATUS.FUTURE,
    headline: "Wallet Plugin Integration",
    milestones: [
      { title: "Approach Solana-native wallets (Phantom, Backpack, Solflare) with the SDK" },
      { title: "Pre-sign overlay rendered inside the wallet confirmation screen" },
      {
        title:
          "Incident response checklist — step-by-step guidance after a compromised or suspicious signing event"
      },
      {
        title:
          "Telemetry-free local reports — exportable risk summaries for incident review, audit, and compliance"
      },
      { title: "Solana-first focus; no dominant local-inference safety layer exists on this chain" }
    ]
  },
  {
    phase: "4",
    label: "Phase 4",
    status: PHASE_STATUS.FUTURE,
    headline: "Voice Scam Shield & Policy Engine",
    milestones: [
      {
        title:
          "Voice Scam Shield — QVAC speech-to-text transcribes suspicious voice notes, support calls, and social-engineering audio locally; same scam rules and RAG applied to transcripts"
      },
      { title: "Target: custody providers and DAOs managing multi-sig wallets" },
      { title: "Rule sets exportable and shareable across teams" }
    ]
  },
  {
    phase: "5",
    label: "Phase 5",
    status: PHASE_STATUS.FUTURE,
    headline: "Enterprise, Custody & Multi-Chain",
    milestones: [
      { title: "Pre-sign policy enforcement with audit logs" },
      { title: "Configurable rule sets per wallet, per organization" },
      { title: "Multi-wallet monitoring dashboard" },
      { title: "On-premise deployment — no external dependencies" },
      {
        title:
          "Multi-chain expansion — EVM and other ecosystems after Solana pre-sign detection is proven and stable"
      }
    ]
  }
];
