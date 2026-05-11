#!/usr/bin/env node
import { createHash, createPublicKey, verify } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const manifestPath = resolve(root, "knowledge/threat-intel.manifest.json");
const signaturePath = resolve(root, "knowledge/threat-intel.signature.json");

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function sha256(path) {
  return createHash("sha256")
    .update(readFileSync(resolve(root, path)))
    .digest("hex");
}

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const signature = JSON.parse(readFileSync(signaturePath, "utf8"));

if (signature.scheme !== "ed25519" || signature.signedCanonicalJson !== true) {
  console.error("Threat-intel signature metadata is not supported.");
  process.exit(1);
}

const hashFailures = [];
for (const source of manifest.sources ?? []) {
  const actual = sha256(source.path);
  if (actual !== source.sha256) {
    hashFailures.push({ path: source.path, expected: source.sha256, actual });
  }
}

if (hashFailures.length > 0) {
  console.error("Threat-intel manifest hash check failed:");
  for (const failure of hashFailures) {
    console.error(`  ${failure.path}`);
    console.error(`    expected ${failure.expected}`);
    console.error(`    actual   ${failure.actual}`);
  }
  process.exit(1);
}

const publicKey = createPublicKey({
  key: Buffer.from(signature.publicKeySpkiDerBase64, "base64"),
  format: "der",
  type: "spki"
});
const validSignature = verify(
  null,
  Buffer.from(canonicalJson(manifest)),
  publicKey,
  Buffer.from(signature.signatureBase64, "base64")
);

if (!validSignature) {
  console.error("Threat-intel Ed25519 signature verification failed.");
  process.exit(1);
}

console.log(
  `Threat-intel bundle verified: ${manifest.bundleId} ${manifest.version} (${manifest.sources.length} sources).`
);
