import "server-only";
import glossaryJson from "../../../../knowledge/solana-instruction-glossary.json";
import type { QvacClient } from "./types";
import { cosineSimilarity } from "./vector";

export interface GlossaryEntry {
  term: string;
  definition: string;
}

declare global {
  var __qvac_glossaryEmbeddings: Array<{ entry: GlossaryEntry; embedding: number[] }> | undefined;
  var __qvac_safetyEmbeddings: Array<{ rule: string; embedding: number[] }> | undefined;
}

const GLOSSARY_ENTRIES: GlossaryEntry[] = Object.entries(glossaryJson as Record<string, string>).map(
  ([term, definition]) => ({ term, definition })
);

async function getGlossaryEmbeddings(qvac: QvacClient) {
  globalThis.__qvac_glossaryEmbeddings ??= await Promise.all(
    GLOSSARY_ENTRIES.map(async (entry) => ({
      entry,
      embedding: await qvac.embeddings.embed({ text: `${entry.term}: ${entry.definition}` })
    }))
  );
  return globalThis.__qvac_glossaryEmbeddings;
}

const GLOSSARY_MIN_SIMILARITY = 0.7;

export async function searchGlossary(qvac: QvacClient, query: string, topK = 5): Promise<GlossaryEntry[]> {
  const embeddings = await getGlossaryEmbeddings(qvac);
  const queryEmbedding = await qvac.embeddings.embed({ text: query });
  return embeddings
    .map(({ entry, embedding }) => ({
      entry,
      similarity: cosineSimilarity(queryEmbedding, embedding)
    }))
    .filter((m) => m.similarity >= GLOSSARY_MIN_SIMILARITY)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK)
    .map((m) => m.entry);
}

function parseSafetyRules(): string[] {
  const RAW = `
Never share your seed phrase, recovery phrase, mnemonic, or private key with anyone — ever.
No legitimate wallet, exchange, protocol, or support agent will ever ask for your seed phrase.
Browser extensions, websites, and dApps have no reason to request your private key.
If a "support agent" asks for your recovery phrase in any channel (Discord, Telegram, Twitter DM, email), it is always a scam.
Never sign a transaction you don't understand. "Blind signing" is dangerous.
A transaction can do more than it appears — always check the full list of instructions, not just the UI label.
SetAuthority instructions permanently transfer control of a token account or mint. Only sign if you fully understand the destination.
CloseAccount instructions send the token balance to a destination address. Verify that destination is yours before signing.
Treat token delegate approvals as high risk unless you understand the spender and the amount limit.
An Approve instruction with a very large or max (u64 max) amount grants unlimited spending permission — treat this as critical risk.
If a transaction was presented with urgency or time pressure, slow down and verify it independently.
Verify the destination address byte-for-byte before signing any transfer. Clipboard hijacking malware can silently replace copied addresses.
Review unknown programs carefully. Unknown does not automatically mean malicious, but it warrants caution.
A legitimate dApp should be verifiable through its official website, docs, and on-chain program ID.
Avoid connecting your wallet to websites you arrived at through unsolicited links, QR codes, or DMs.
WalletConnect QR codes and deep links can connect your wallet to malicious dApps — only use them from trusted sources.
Be skeptical of urgent airdrops, refund portals, wallet validation pages, and fake support accounts.
Scammers impersonate founders, official teams, Discord moderators, Telegram admins, and exchange support.
"Limited time", "expires soon", "claim now", and "last chance" are pressure tactics designed to prevent careful thought.
Official projects never DM users first about rewards, migrations, or security alerts.
Fake governance votes, protocol upgrades, and migrations are used to trick users into signing approval or SetAuthority transactions.
Receiving unexpected tokens or tiny SOL amounts (dust) is a known tactic to identify active wallets for follow-up phishing.
Do not interact with (swap, transfer, or click links in) unknown airdropped tokens — they may trigger malicious contract calls.
Verify token mint addresses against official sources. Lookalike token names (e.g. fake USDC) with different mint addresses are a common scam.
Tokens promising guaranteed returns, "100x", or insider presales should be treated as likely scams or rug pulls.
NFT free mints may embed approval or SetAuthority instructions alongside the mint instruction.
No legitimate recovery service can restore a compromised wallet without your seed phrase.
Any "wallet rescue" service that asks for your seed phrase or private key is stealing your funds.
Never install remote desktop software (AnyDesk, TeamViewer) at a support agent's request — this is a known scam vector.
If your wallet has been compromised, move remaining assets to a new wallet immediately using a clean device.
Use hardware wallets for large holdings. Software wallets on internet-connected devices are always higher risk.
Keep your OS and wallet software updated to reduce exposure to known vulnerabilities.
  `.trim();
  return RAW.split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

const SAFETY_RULES: string[] = parseSafetyRules();

async function getSafetyEmbeddings(qvac: QvacClient) {
  globalThis.__qvac_safetyEmbeddings ??= await Promise.all(
    SAFETY_RULES.map(async (rule) => ({
      rule,
      embedding: await qvac.embeddings.embed({ text: rule })
    }))
  );
  return globalThis.__qvac_safetyEmbeddings;
}

const SAFETY_MIN_SIMILARITY = 0.72;

export async function searchSafetyRules(qvac: QvacClient, query: string, topK = 4): Promise<string[]> {
  const embeddings = await getSafetyEmbeddings(qvac);
  const queryEmbedding = await qvac.embeddings.embed({ text: query });
  return embeddings
    .map(({ rule, embedding }) => ({
      rule,
      similarity: cosineSimilarity(queryEmbedding, embedding)
    }))
    .filter((m) => m.similarity >= SAFETY_MIN_SIMILARITY)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK)
    .map((m) => m.rule);
}
