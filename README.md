# Guardian Wallet Firewall

> **Colosseum Frontier Hackathon 2026**  
> Local-first transaction firewall for Solana. On-device AI. No cloud AI. No API keys.

You're about to sign a transaction you don't fully understand. Guardian tells you what it does, how risky it is, and what to do about it, in under 10 seconds, with AI inference running locally through QVAC before you click confirm.

[![Watch the demo](https://img.shields.io/badge/▶%20Watch%20Demo-Google%20Drive-blue?style=for-the-badge&logo=googledrive)](https://drive.google.com/file/d/1fPqJSJ2Jy5aXXYUMnNAqOPxv_Pn0jSzF/view?usp=drive_link)

---

## Judging Scorecard

| Criterion                  | Guardian Evidence                                                                                                                                                                                                                                                |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Technical execution**    | Next.js 15 app router, browser extension (interceptor + relay + background), Solana parser (legacy + versioned tx), 4 QVAC capabilities wired in core path, Guardian policy engine, Vitest tests, TypeScript typecheck passing, production build passing         |
| **QVAC integration depth** | OCR reads scam screenshots on-device; offline NMT translation normalises non-English scam text; embeddings + RAG retrieve local scam patterns; LLM explains deterministic risk evidence — all four in the critical product path, zero cloud calls                |
| **Innovation**             | Deterministic risk engine (score cannot be changed by the LLM) + local QVAC explanation + intent firewall + Guardian policy engine + RPC simulation status with pre/post balance diff and locally decoded asset/permission effects + multilingual scam detection |
| **Real-world use case**    | Wallet drainers, delegate approvals, fake airdrops, Pump.fun rug pulls, MEV impersonation, scam DMs in any language — each tested against a local knowledge base                                                                                                 |
| **UX / usability**         | Pre-sign extension overlay, silent Low-risk pass-through to avoid alert fatigue, one-click revoke + batch revoke, report export, offline PWA                                                                                                                     |
| **Completeness**           | README, DEMO.md script, sample cases, QVAC smoke test, 30-case deterministic eval benchmark, signed threat-intel verification, report export, offline fallback page                                                                                              |

---

### For QVAC Track Judges

> Guardian uses QVAC in the **core product path**: OCR reads scam screenshots, offline translation normalises non-English attacks, embeddings retrieve local scam knowledge, and the LLM explains deterministic risk findings — without sending wallet context, screenshots, or trading intent to any cloud model.

### For Main Track / 100xDevs Judges

> Guardian is a **usable Solana wallet firewall**: it explains transactions before signing, scans scam screenshots offline, detects active delegates, and helps users revoke dangerous permissions — all locally, without a subscription or API key.

---

## Table of Contents

1. [The Problem](#the-problem)
2. [The Solution](#the-solution)
3. [QVAC Integration](#qvac-integration)
4. [Architecture](#architecture)
5. [Quick Start](#quick-start)
6. [QVAC Setup](#qvac-setup-real-local-inference)
7. [Test Scenarios](#test-scenarios)
8. [Commands](#commands)
9. [Roadmap](#roadmap)
10. [For Wallet Developers](#for-wallet-developers)

---

## The Problem

Solana users lose real money to wallet drainers, phishing, fake airdrops, and malicious delegate approvals every day.

Every existing tool — Blowfish, Pocket Universe, Rabby simulation — routes your wallet data through a cloud API. That means your transaction history, wallet address, token holdings, and screenshots of suspicious DMs all leave your device before you get a safety verdict.

**Sending a scam screenshot to a cloud AI to check for scams is itself a privacy violation.** The screenshot typically contains your Telegram username, wallet address, and contact list. The very act of checking exposes the data you're trying to protect.

---

## The Solution

Guardian is a **local-first transaction firewall** for Solana wallets. It runs on a server you control using [QVAC](https://qvac.tether.io) — Tether's decentralized, local-first AI SDK — to detect dangerous signing flows, explain risk in plain English, and prepare protective actions, all without leaking wallet context, screenshots, or trading intent to any cloud model. AI inference never leaves your machine; the current architecture requires the Guardian server to be running locally (desktop/laptop). Mobile support depends on QVAC shipping an on-device mobile runtime.

### Three Layers

| Layer       | What it does                                                                          |
| ----------- | ------------------------------------------------------------------------------------- |
| **Know**    | Wallet Profile: understand what you hold, who has delegate access, and what's at risk |
| **Protect** | Transaction Analyzer + Screenshot Scanner: detect danger before you sign              |
| **Act**     | Action Layer + policy engine: block risky flows and build unsigned protective actions |

### Why Not Cloud AI?

|                        | Guardian                                                         | Blowfish / Pocket Universe |
| ---------------------- | ---------------------------------------------------------------- | -------------------------- |
| Wallet address         | Local AI only; optional RPC lookup for wallet profile            | Sent to cloud safety API   |
| Transaction contents   | Local AI only; signature lookup uses Solana RPC                  | Sent to cloud safety API   |
| Screenshot of scam DM  | Stays on device; OCR and translation run locally                 | Sent to cloud safety API   |
| Token holdings         | Fetched from Solana RPC for wallet profile; not sent to cloud AI | Sent to cloud safety API   |
| Works without cloud AI | ✅                                                               | ❌                         |
| No AI API key required | ✅                                                               | ❌                         |
| No subscription        | ✅                                                               | ❌                         |

---

## QVAC Integration

Guardian uses **four QVAC AI capabilities** in its core product flows. QVAC is not a bolt-on feature — it is the reasoning and perception layer that makes local-first wallet safety possible.

> **Guardian uses QVAC as a private reasoning and perception layer for wallet safety. Rules decide risk; QVAC reads screenshots, retrieves local scam knowledge, and explains the evidence on-device.**

### Capabilities Used

| QVAC Package               | Guardian Use                                                                                                                                   |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `@qvac/llm-llamacpp`       | Plain-English transaction and scam risk explanation (Llama 3.2 1B, local)                                                                      |
| `@qvac/ocr-onnx`           | Extract text from suspicious screenshots entirely on-device                                                                                    |
| `@qvac/embed-llamacpp`     | Semantic search over a local scam-pattern knowledge base (RAG)                                                                                 |
| `@qvac/translation-nmtcpp` | Offline multilingual scam message translation — detects and translates non-English scam text to English before analysis, with zero cloud calls |

### Why This Integration Is Meaningful

QVAC is in the **critical path** of every major product flow:

**Transaction analysis:**

```
User transaction → Solana parser → deterministic risk rules → intent check → QVAC LLM → explanation
```

**Screenshot scanning:**

```
Screenshot → QVAC OCR → QVAC Translation (auto-detect + translate to EN) → scam signal rules → QVAC embeddings/RAG → QVAC LLM → warning
```

**Wallet profile:**

```
Wallet address → RPC fetch → delegate / dust / balance rules → QVAC LLM → risk summary + unsigned revoke tx
```

This is much stronger than wrapping an LLM. The deterministic engine produces the risk score; QVAC explains the evidence and reads private screenshots — locally, without any external API call.

### What "On-Device" Means (Precision)

> Guardian never sends wallet data, screenshots, transaction contents, or user intent to cloud AI APIs. Optional on-chain lookups (wallet profile, live transaction fetch) use the configured Solana RPC endpoint. Users can point this to their own node or a private provider if full network isolation is required.

### Running the QVAC Smoke Test

```bash
npm run qvac:test
# With OCR:
QVAC_TEST_IMAGE=/path/to/screenshot.png npm run qvac:test
```

QVAC status badges show `Configured` before first inference, `Loading` during model load, and `Active` after a successful local inference call. The translation badge turns `Active` only after a non-English sample is translated successfully.

---

## Architecture

### Folder Structure

```
apps/web/
  app/                        Next.js App Router pages and API routes
    api/
      analyze-transaction/    POST — parse + simulate + policy-check + risk-score + intent-check + QVAC LLM explain
      scan-screenshot/        POST — QVAC OCR + translation + scam signals + QVAC RAG + QVAC LLM explain
      wallet-profile/         POST — on-chain fetch + risk rules + QVAC LLM explain
      build-revoke-tx/        POST — build unsigned SPL Token Revoke transaction
      extension-download/     GET  — package and download extension/ as a zip
      qvac-status/            GET  — live status of LLM / OCR / embeddings / RAG / translation
    offline/                  Offline fallback page (served by service worker)
  components/
    features/
      risk/                   Shared risk display — Score, Reasons, Explanation, Rag
      scan/                   Screenshot scanner — file upload, OCR output, scan flow
      status/                 QVAC status banner — live badges for each capability
      transaction/            Transaction analyzer — context selector, policy engine, simulation effect, facts, IntentMatch
      wallet/                 Wallet profile — address input, on-chain facts, action layer
      how/                    How It Works — pipeline explainer, tools, privacy model
      roadmap/                Roadmap — shipped milestones, next phases, vision
    ui/                       Design system — Badge, Button, Card, Logo, QvacBadge
  lib/
    hooks/                    useApiRequest — loading / error / data state
    qvac/                     QVAC adapter — qvacClient, llm, ocr, rag, types, vector
    risk/                     Deterministic engine — scoreRisk, scamSignals, intentCheck, policy
    solana/                   Solana utils — parseTransaction, walletProfile, riskRules
  public/
    sw.js                     Service worker — cache-first static, network-first nav
knowledge/
  scam-patterns.json          Local scam-pattern knowledge base (embedded by RAG at runtime)
  threat-intel.manifest.json  Signed manifest for local threat-intel sources
  threat-intel.signature.json Ed25519 signature for the threat-intel manifest
  wallet-safety-rules.md      Plain-English rules informing deterministic risk detection
  solana-instruction-glossary.json  Human-readable labels for Solana program instructions
extension/
  manifest.json               Browser extension manifest
  background.js               Extension service worker — handles CORS-free fetch to Guardian API
  interceptor.js              Signs-call interceptor — patches wallet signing methods before the page loads (MAIN world)
  relay.js                    Message relay — bridges interceptor (MAIN world) to background via chrome.runtime (ISOLATED world)
  popup.html / popup.js       Extension popup UI
```

### Security Hardening

The following properties hold across all Guardian API routes and extension components:

| Area                            | Measure                                                                                                                                                                                                                                                                                                                                                                      |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Input size limits**           | Screenshot uploads capped at 10 MB; MIME type must be PNG, JPEG, WebP, or GIF. Base64 transaction strings capped at 20 KB at the relay/background extension boundary. User intent strings capped at 500 characters.                                                                                                                                                          |
| **Error information leakage**   | API error responses never expose internal error messages or stack traces. All error bodies are fixed, generic strings; detail is logged server-side only.                                                                                                                                                                                                                    |
| **Prompt injection**            | User-supplied intent is flagged as untrusted in the prompt. The risk score, level, and findings are produced by deterministic rules before the LLM runs — the LLM explains evidence it cannot change. `riskLevel` is hardcoded from the deterministic score in the JSON schema; `suggestedAction` and `confidence` are overridden post-generation at Critical and High risk. |
| **SSRF protection**             | `SOLANA_RPC_URL` is validated at server startup. Cloud metadata addresses (169.254.x.x, metadata.google.internal) are blocked and fall back to the public Solana mainnet RPC.                                                                                                                                                                                                |
| **CORS**                        | The `/api/analyze-transaction` route returns `Access-Control-Allow-Origin: *` to allow the Chrome extension's service worker (which runs on a `chrome-extension://` origin) to reach the local server. All other routes are restricted by Next.js defaults. The extension itself restricts which pages it intercepts via `host_permissions` in `manifest.json`.              |
| **Extension message integrity** | `interceptor.js` generates request IDs using `crypto.getRandomValues()` (not `Math.random()`). `postMessage` calls use `window.location.origin` rather than `"*"` so transaction data is not broadcast to other page scripts.                                                                                                                                                |
| **Extension payload limits**    | `relay.js` and `background.js` both enforce a 20 KB payload cap and a 128-character ID length cap before forwarding requests, preventing DoS via oversized messages.                                                                                                                                                                                                         |
| **Extension download**          | The `/api/extension-download` endpoint excludes `.env`, `.env.*`, `.DS_Store`, and `*.log` patterns from the generated zip.                                                                                                                                                                                                                                                  |
| **Signed threat intel**         | `knowledge/threat-intel.manifest.json` pins local threat-intel source hashes and `knowledge/threat-intel.signature.json` verifies the manifest with Ed25519 via `npm run threat:intel:verify`.                                                                                                                                                                               |

> **Threat intelligence policy:** The malicious program registry (`KNOWN_MALICIOUS_PROGRAMS`) is populated only from verified primary sources — OtterSec incident reports, Blowfish threat database, Helius security advisories, and on-chain forensics. Unverified entries are intentionally excluded: a false positive on a legitimate program is more harmful than a missed detection. The same policy applies to the `KNOWN_BAD_ACTORS` wallet list.

---

### The Deterministic-First Design

One of the most important architectural decisions in Guardian is that **the LLM does not decide the risk score**:

```
Deterministic parser → structured evidence (cannot be hallucinated)
         ↓
Risk rule engine → score 0–100 + labeled findings (final; LLM cannot change it)
         ↓
QVAC LLM → plain-English explanation of what the rules already found
         ↓
Post-processing guardrails → confidence and action overridden by deterministic score
```

This means a wallet with zero activity always returns clean. A Critical transaction always says "Do not sign." The LLM explains evidence; it does not invent risk.

### Intent Firewall

The `checkIntent()` function lets users declare what they expect a transaction to do:

```
User intent: "claim my airdrop reward"
Transaction: approves a delegate authority
Result: CRITICAL MISMATCH — this tx does not do what you expect
```

`checkIntent()` uses deterministic keyword rules to produce a typed verdict (`match`, `partial_mismatch`, `critical_mismatch`, `unclear`) before the LLM runs. The LLM explains the verdict; the rules decide it.

### Simulation Effect + Policy Engine

For raw pre-sign transaction bytes, Guardian also calls Solana RPC simulation to confirm whether the transaction would execute. When RPC returns simulated account data, Guardian compares pre/post SOL and token account balances for tracked accounts; it also displays locally decoded asset and permission effects: outgoing/incoming SOL or token movement, delegate approvals, and authority changes.

Guardian policy checks run before scoring and before the QVAC explanation. The default policy blocks delegate approvals, requires review for authority changes, and caps outgoing SOL; DAO and custody presets make unknown-program review and transfer limits stricter. Policy violations are normal deterministic findings, so they appear in the same score, report export, and QVAC explanation path as other risks.

### Browser Extension

The browser extension is the distribution path: it intercepts signing calls before the wallet popup and shows Guardian's local risk overlay.

**Interception paths covered:**

- `window.solana` / `window.solflare` / `window.backpack.solana` — legacy wallet shims (`signTransaction`, `signAllTransactions`, `signAndSendTransaction`)
- **Wallet Standard protocol** — modern dApps (Raydium, Jupiter) use the `wallet-standard:register-wallet` / `wallet-standard:app-ready` event system; Guardian patches the wallet features before the dApp's adapter sees them

**CORS bypass architecture:**
Content scripts in `MAIN` world cannot call `chrome.runtime` and cannot fetch `localhost` from a live dApp origin. The relay chain solves this without any server changes:

```
interceptor.js (MAIN) → window.postMessage → relay.js (ISOLATED) → chrome.runtime.sendMessage → background.js → fetch(localhost:3000)
```

**Overlay trigger:** Guardian only shows the risk overlay for Medium, High, or Critical transactions. Low risk passes through silently to avoid alert fatigue.

> Prototype support for Phantom, Backpack, and Solflare — both legacy shim and Wallet Standard registration paths. The PWA proves the analysis engine. The extension proves the integration path.

---

## Quick Start

**Prerequisites:** Node.js 22+, npm 9+, macOS / Linux / Windows.

```bash
npm install
make start        # start dev server at http://localhost:3000
# or: npm run dev
```

Open `http://localhost:3000`.

> **No QVAC models required to explore the UI.** All three tools load and the deterministic risk engine runs fully. Analysis endpoints return a structured result with a deterministic score — the LLM explanation field will be empty until QVAC models are configured (see [QVAC Setup](#qvac-setup-real-local-inference)).

**Mobile / reviewer access** (same WiFi network):

```bash
make preview      # binds to 0.0.0.0, prints your local IP for use on mobile
```

---

## QVAC Setup (Real Local Inference)

**Requirements:** Node.js 22+, macOS / Linux / Windows. Models download once to `~/.qvac/models/`.

```bash
cp apps/web/.env.example apps/web/.env.local
```

Edit `.env.local`:

```env
QVAC_DEVICE=gpu            # or cpu
QVAC_LLM_CONTEXT_SIZE=8192
QVAC_LLM_MODEL_PRESET=LLAMA_3_2_1B_INST_Q4_0
QVAC_EMBED_MODEL_PRESET=GTE_LARGE_FP16
QVAC_OCR_MODEL_PRESET=OCR_LATIN_RECOGNIZER_1
```

### Environment Variables

| Variable                      | Values         | Default                 | Purpose                                                                                                                                                       |
| ----------------------------- | -------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `QVAC_DEVICE`                 | `gpu` \| `cpu` | `cpu`                   | Accelerator — use `gpu` on Apple Silicon / CUDA                                                                                                               |
| `QVAC_LLM_CONTEXT_SIZE`       | integer        | `4096`                  | LLM context window size in tokens                                                                                                                             |
| `QVAC_LLM_MODEL_PRESET`       | preset name    | —                       | QVAC model registry preset for LLM                                                                                                                            |
| `QVAC_EMBED_MODEL_PRESET`     | preset name    | —                       | QVAC model registry preset for embeddings                                                                                                                     |
| `QVAC_OCR_MODEL_PRESET`       | preset name    | —                       | QVAC model registry preset for OCR                                                                                                                            |
| `QVAC_TRANSLATE_MODEL_PRESET` | preset name    | `OPUS_MT_MULTI_EN`      | QVAC NMT model preset for offline translation                                                                                                                 |
| `QVAC_LLM_MODEL_SRC`          | file path      | —                       | Local `.gguf` model path (overrides preset)                                                                                                                   |
| `QVAC_EMBED_MODEL_SRC`        | file path      | —                       | Local embedding model path (overrides preset)                                                                                                                 |
| `QVAC_OCR_MODEL_SRC`          | file path      | —                       | Local OCR model directory (overrides preset)                                                                                                                  |
| `QVAC_TRANSLATE_MODEL_SRC`    | file path      | —                       | Local NMT translation model path (overrides preset)                                                                                                           |
| `QVAC_TEST_IMAGE`             | file path      | —                       | Image for `npm run qvac:test` OCR smoke test                                                                                                                  |
| `SOLANA_RPC_URL`              | URL            | mainnet-beta RPC        | Solana RPC endpoint for wallet profile and revoke tx. Validated at startup — cloud metadata addresses (169.254.x.x) are blocked and fall back to the default. |
| `NEXT_PUBLIC_APP_URL`         | URL            | `http://localhost:3000` | Origin used for the `Access-Control-Allow-Origin` header on all `/api/` routes. Set this to your deployment domain in production.                             |

### Verifying QVAC Is Active

```bash
npm run qvac:test
```

When QVAC is running:

- Terminal shows model load and inference output
- Core status badges in the UI move from `Configured` to `Active` after successful local inference. Run one transaction analysis and one Spanish screenshot scan to warm all four QVAC capabilities.
- Restart the dev server after editing `.env.local` for env changes to take effect

---

## Test Scenarios

### Transaction Analyzer

| Input                             | Expected risk |
| --------------------------------- | ------------- |
| Safe SOL transfer                 | Low           |
| SPL token transfer                | Low           |
| Suspicious token approval         | Critical      |
| Unknown program interaction       | High          |
| Multiple asset transfer           | High          |
| Any live Solana signature (paste) | Varies        |

Transaction Analyzer supports four context modes — **Pre-sign**, **Sender**, **Recipient**, **Viewer** — each producing context-aware risk descriptions.

### Screenshot Scanner

| Input                             | Expected risk |
| --------------------------------- | ------------- |
| Telegram seed phrase scam message | Critical      |
| Fake airdrop claim message        | High          |
| Fake wallet validation popup      | Critical      |

### Wallet Profile

| Input                                   | What it shows                                                                                                                                |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Wallet with active delegate             | High risk + one-click Revoke per delegate + **Batch Revoke** (packs all revocations into a single transaction) + Incident Response checklist |
| Known bad actor (Wormhole / Mango)      | Critical 95/100 — flagged from local `KNOWN_BAD_ACTORS` dataset                                                                              |
| Wallet with 5+ dust/zero-balance tokens | Low risk finding flagging dust/airdrop attack pattern                                                                                        |
| Any valid Solana address                | SOL balance, token accounts, delegates, recent tx count, risk summary                                                                        |

**Built-in sample addresses** (Quick-load buttons in the UI):

| Label               | Address                                        | Purpose                                                                |
| ------------------- | ---------------------------------------------- | ---------------------------------------------------------------------- |
| Regular wallet      | `GThUX1Atko4tqhN2NaiTazWSeFWMuiUvfFnyJyUghFMJ` | Clean personal wallet, expected Low risk                               |
| Coinbase Hot Wallet | `H8sMJSCQxfKiFTCfDR3DUMLPwcRbM61LGFJ8N4dK3WjS` | High-volume exchange wallet                                            |
| Binance Hot Wallet  | `9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM` | Large exchange hot wallet                                              |
| Active delegates    | `CuieVDEDtLo7FypA9SbLM9saXFdb1dsshEkyErMqkRQq` | Real DeFi user with 2 active delegates — shows High risk + Revoke flow |
| Wormhole exploiter  | `Htp9MGP8Tig923ZFY7Qf2zzbMUmYneFRAhSp7vSg4wxV` | Known bad actor — Critical 95/100                                      |

---

## QVAC Integration Details

All four AI capabilities are wired behind clean adapter interfaces in `apps/web/lib/qvac/`:

| File            | Role                                                                |
| --------------- | ------------------------------------------------------------------- |
| `qvacClient.ts` | Loads all models lazily on first use; translation model is optional |
| `llm.ts`        | LLM generation with JSON parsing and fallback extraction            |
| `ocr.ts`        | Image-to-text via QVAC OCR model                                    |
| `rag.ts`        | Cosine similarity search over embedded scam patterns                |
| `vector.ts`     | In-memory vector store — no external DB required                    |

The local knowledge base lives in [`knowledge/wallet-safety-rules.md`](knowledge/wallet-safety-rules.md) and [`knowledge/scam-patterns.json`](knowledge/scam-patterns.json). Scam screenshots, OCR text, embeddings/RAG, and QVAC explanations stay local; optional wallet profile and signature lookups use Solana RPC for public on-chain data.

---

## Commands

```bash
make install          # install dependencies
make start            # start dev server (localhost:3000)
make preview          # start on local network — prints IP for mobile reviewers
make stop             # stop the dev server
make build            # Next.js production build
make test             # Vitest unit tests
make check            # TypeScript + ESLint
make clean            # delete .next build cache
make qvac-test        # QVAC smoke test (LLM + embeddings + optional OCR)
make eval             # deterministic risk engine benchmark
make threat-intel     # verify signed local threat-intel bundle

# npm equivalents
npm run lint          # ESLint
npm run typecheck     # TypeScript
npm run test          # Vitest
npm run build         # production build
npm run format        # Prettier (write)
npm run format:check  # Prettier (check only)
npm run qvac:test     # QVAC smoke test
npm run eval          # deterministic risk engine benchmark
npm run threat:intel:verify
```

---

## Roadmap

### Phase 1 — Consumer Proof of Concept ✅ Shipped

- PWA: Transaction Analyzer + Screenshot Scanner + Wallet Profile + Action Layer
- Intent Firewall: declare expected tx behavior; Guardian flags mismatches
- Guardian policy engine: personal, DAO, and custody presets for pre-sign blocking rules
- RPC simulation status with locally decoded asset and permission effects
- Multilingual Scam Shield: QVAC offline translation detects and translates non-English scam text before analysis
- Signed threat-intel manifest: local scam-pattern and wallet-risk sources are hash-pinned and Ed25519-verified
- QVAC status dashboard with live capability health badges
- Browser extension prototype: intercepts signing flows before wallet confirmation
- Offline support via PWA service worker

### Phase 2 — SDK Extraction & Hardening _(Planned)_

- Extract `@guardian/risk-sdk` — the deterministic + QVAC pipeline as a standalone npm package any wallet can integrate. No UI, no Next.js dependency. The QVAC explanation layer is optional; the deterministic layer works standalone.
- Browser extension hardening — stable interception across Phantom, Backpack, and Solflare signing flows
- QVAC health endpoint — report model load status, last inference result, and error reason separately from configuration
- Action Layer expansion — close dust token accounts, block high-risk signing flows

### Phase 3 — Wallet Plugin Integration _(Future)_

Approach Solana-native wallets (Phantom, Backpack, Solflare) with the SDK. Pre-sign overlay inside the wallet confirmation screen. Incident response checklists and telemetry-free local reports for audit and compliance.

### Phase 4 — Voice Scam Shield _(Future)_

QVAC speech-to-text transcribes suspicious voice notes, support calls, and social-engineering audio locally — the same scam rules and RAG applied to transcripts, with no audio leaving the device. The existing policy engine expands into organization-level templates, signer groups, and audit exports.

### Phase 5 — Enterprise, Custody & Multi-Chain _(Future)_

Pre-sign policy enforcement with audit logs, configurable rule sets per wallet and per organization, multi-wallet monitoring, on-premise deployment. Multi-chain expansion after Solana pre-sign detection is proven and stable.

---

## For Wallet Developers

The core risk engine (`parseTransaction`, `evaluateTransactionRisk`, `evaluateWalletRisk`, `scoreFindings`) is chain-aware but UI-independent. Any Solana wallet can add Guardian's transaction firewall in a weekend.

**Integration surface (Phase 2 SDK extraction target):**

```ts
import { analyzeTransaction } from "@guardian/risk-sdk";

const result = await analyzeTransaction(rawBase64Transaction, {
  userIntent: "swap USDC for SOL",
  policy: { mode: "dao", blockUnknownPrograms: true },
  qvac: "local" // or "disabled" — deterministic layer works standalone
});
// result.assessment.level → "Low" | "Medium" | "High" | "Critical"
// result.assessment.score → 0–100
// result.assessment.findings → labeled risk findings
// result.explanation → plain-English QVAC LLM output (if qvac !== "disabled")
// result.simulationResult → { wouldSucceed, error?, balanceChanges, assetChanges, permissionChanges }
```

**Target integration partners:**

| Wallet / Platform            | Integration mode                                  |
| ---------------------------- | ------------------------------------------------- |
| Phantom                      | Pre-sign overlay inside wallet confirmation       |
| Backpack                     | Extension + Wallet Standard hook                  |
| Solflare                     | Extension + legacy shim                           |
| DAO tooling (Squads, Realms) | SDK — pre-sign policy enforcement before multisig |
| Custody providers            | SDK — configurable block policies, audit log      |

**Why Guardian is the right fit:**

- **No cloud dependency** — wallet providers cannot send user transactions to a third-party API without consent; Guardian's local-first architecture fits natively
- **Deterministic core** — risk scores are reproducible and auditable; the LLM only explains, never decides
- **Private RPC compatible** — works with any Solana RPC, including wallet-provided or self-hosted nodes
- **QVAC explanation is optional** — the deterministic parser and risk rules ship standalone, QVAC adds plain-English context

**Solana is underserved vs. EVM.** No dominant local-inference safety layer exists. The consumer PWA is the proof of concept. The SDK is the product.

---

## Resources

- **QVAC homepage:** https://qvac.tether.io
- **QVAC docs:** https://docs.qvac.tether.io
- **QVAC GitHub:** https://github.com/tetherto/qvac
- **Colosseum Frontier:** https://frontier.colosseum.org
- **Tether QVAC side track:** https://superteam.fun/earn/listing/tether-frontier-hackathon-track

---

## License

MIT © 2026 Guardian Wallet. See [LICENSE](LICENSE).
