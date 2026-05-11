#!/usr/bin/env node
/**
 * Guardian Wallet — Deterministic risk engine benchmark
 *
 * Runs eval cases directly against the TypeScript risk engine via vite-node.
 * No network required. QVAC/LLM not involved.
 *
 * Usage:
 *   npm run eval
 *   vite-node --config apps/web/vitest.config.ts scripts/run-eval.mjs
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

// ---------------------------------------------------------------------------
// Load eval fixture files
// ---------------------------------------------------------------------------
const maliciousCases = JSON.parse(readFileSync(resolve(root, "eval/transactions/malicious.json"), "utf8"));
const safeCases = JSON.parse(readFileSync(resolve(root, "eval/transactions/safe.json"), "utf8"));
const scamTextCases = JSON.parse(readFileSync(resolve(root, "eval/scam-text/cases.json"), "utf8"));

// ---------------------------------------------------------------------------
// Dynamically import the TypeScript risk engine through vite-node.
// ---------------------------------------------------------------------------
let evaluateTransactionRisk;
let evaluateScamText;
let scoreFindings;

try {
  const riskRules = await import(resolve(root, "apps/web/lib/solana/riskRules.ts"));
  const scamSignals = await import(resolve(root, "apps/web/lib/risk/scamSignals.ts"));
  const scoreRisk = await import(resolve(root, "apps/web/lib/risk/scoreRisk.ts"));
  evaluateTransactionRisk = riskRules.evaluateTransactionRisk;
  evaluateScamText = scamSignals.evaluateScamText;
  scoreFindings = scoreRisk.scoreFindings;
} catch (err) {
  console.error(
    "\nFailed to import TypeScript risk engine.\n" +
      "Run this script with: vite-node --config apps/web/vitest.config.ts scripts/run-eval.mjs\n" +
      "or via: npm run eval\n"
  );
  console.error(err.message);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Run cases
// ---------------------------------------------------------------------------
const results = [];
let passed = 0;
let failed = 0;

function runMaliciousCase(c) {
  const findings = evaluateTransactionRisk(c.facts, "pre-sign");
  const assessment = scoreFindings(findings);
  const foundIds = findings.map((f) => f.id);

  const missingFindings = (c.expectedFindings ?? []).filter((id) => !foundIds.includes(id));
  const scoreTooLow = c.expectedMinScore != null && assessment.score < c.expectedMinScore;

  const ok = missingFindings.length === 0 && !scoreTooLow;
  results.push({
    type: "malicious",
    id: c.id,
    description: c.description,
    ok,
    score: assessment.score,
    level: assessment.level,
    foundIds,
    missingFindings,
    scoreTooLow,
    expectedMinScore: c.expectedMinScore,
    expectedFindings: c.expectedFindings
  });
  return ok;
}

function runSafeCase(c) {
  const findings = evaluateTransactionRisk(c.facts, "pre-sign");
  const assessment = scoreFindings(findings);

  const scoreTooHigh = c.expectedMaxScore != null && assessment.score > c.expectedMaxScore;

  const ok = !scoreTooHigh;
  results.push({
    type: "safe",
    id: c.id,
    description: c.description,
    ok,
    score: assessment.score,
    level: assessment.level,
    foundIds: findings.map((f) => f.id),
    scoreTooHigh,
    expectedMaxScore: c.expectedMaxScore
  });
  return ok;
}

function runScamTextCase(c) {
  const findings = evaluateScamText(c.text);
  const assessment = scoreFindings(findings);
  const foundIds = findings.map((f) => f.id);

  const missingFindings = (c.expectedFindings ?? []).filter((id) => !foundIds.includes(id));
  const scoreTooLow = c.expectedMinScore != null && assessment.score < c.expectedMinScore;
  const scoreTooHigh = c.expectedMaxScore != null && assessment.score > c.expectedMaxScore;

  const ok = missingFindings.length === 0 && !scoreTooLow && !scoreTooHigh;
  results.push({
    type: "scam-text",
    id: c.id,
    description: c.description,
    ok,
    score: assessment.score,
    level: assessment.level,
    foundIds,
    missingFindings,
    scoreTooLow,
    scoreTooHigh,
    expectedMinScore: c.expectedMinScore,
    expectedMaxScore: c.expectedMaxScore,
    expectedFindings: c.expectedFindings
  });
  return ok;
}

console.log("\n╔══════════════════════════════════════════════════════════════╗");
console.log("║        Guardian Wallet — Risk Engine Eval Suite              ║");
console.log("╚══════════════════════════════════════════════════════════════╝\n");

// Malicious cases
console.log("── Malicious transaction cases ─────────────────────────────────\n");
for (const c of maliciousCases) {
  const ok = runMaliciousCase(c);
  ok ? passed++ : failed++;
  const r = results.at(-1);
  const tag = ok ? "✅ PASS" : "❌ FAIL";
  console.log(`  ${tag}  [${c.id}]  score=${r.score} level=${r.level}`);
  if (!ok) {
    if (r.missingFindings.length > 0) {
      console.log(`         Missing findings: ${r.missingFindings.join(", ")}`);
      console.log(`         Found:           ${r.foundIds.join(", ") || "(none)"}`);
    }
    if (r.scoreTooLow) {
      console.log(`         Score ${r.score} < expected minimum ${r.expectedMinScore}`);
    }
  }
}

// Safe cases
console.log("\n── Safe transaction cases ──────────────────────────────────────\n");
for (const c of safeCases) {
  const ok = runSafeCase(c);
  ok ? passed++ : failed++;
  const r = results.at(-1);
  const tag = ok ? "✅ PASS" : "❌ FAIL";
  console.log(`  ${tag}  [${c.id}]  score=${r.score} level=${r.level}`);
  if (!ok) {
    console.log(`         Score ${r.score} > expected max ${r.expectedMaxScore}`);
    console.log(`         Triggered findings: ${r.foundIds.join(", ") || "(none)"}`);
  }
}

// Screenshot/text scam cases
console.log("\n── Screenshot and pasted-text scam cases ───────────────────────\n");
for (const c of scamTextCases) {
  const ok = runScamTextCase(c);
  ok ? passed++ : failed++;
  const r = results.at(-1);
  const tag = ok ? "✅ PASS" : "❌ FAIL";
  console.log(`  ${tag}  [${c.id}]  score=${r.score} level=${r.level}`);
  if (!ok) {
    if (r.missingFindings.length > 0) {
      console.log(`         Missing findings: ${r.missingFindings.join(", ")}`);
      console.log(`         Found:           ${r.foundIds.join(", ") || "(none)"}`);
    }
    if (r.scoreTooLow) {
      console.log(`         Score ${r.score} < expected minimum ${r.expectedMinScore}`);
    }
    if (r.scoreTooHigh) {
      console.log(`         Score ${r.score} > expected max ${r.expectedMaxScore}`);
      console.log(`         Triggered findings: ${r.foundIds.join(", ") || "(none)"}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
const total = passed + failed;
const pct = Math.round((passed / total) * 100);

console.log(`\n────────────────────────────────────────────────────────────────`);
console.log(`  Total: ${total}   Passed: ${passed}   Failed: ${failed}   (${pct}%)\n`);

if (failed > 0) {
  console.error(`  ${failed} case(s) failed. See above for details.\n`);
  process.exit(1);
} else {
  console.log("  All eval cases passed.\n");
  process.exit(0);
}
