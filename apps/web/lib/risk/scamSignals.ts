import type { RiskFinding } from "../solana/types";

const rules: Array<{
  id: string;
  title: string;
  severity: RiskFinding["severity"];
  scoreImpact: number;
  pattern: RegExp;
  explanation: string;
  /** If this pattern matches the text immediately BEFORE the main match, the rule is suppressed (negation context). */
  negatedBy?: RegExp;
}> = [
  {
    id: "seed-phrase-request",
    title: "Mentions seed or recovery phrase",
    severity: "critical",
    scoreImpact: 55,
    // Also catches garbled MT output: "Se-phrase", "seid phrase", "sid-phrase", etc.
    pattern:
      /\b(seed phrase|recovery phrase|secret phrase|mnemonic|se[id][- ]phrase|s[iy]d[- ]phrase|\bphrase\b.{0,30}\b(word|words|enter|input|type|wallet))\b/i,
    negatedBy: /\b(no|without|never|not|don'?t|doesn'?t|won'?t|cannot|can'?t)\b\s*(\w+\s+){0,4}$/i,
    explanation: "Legitimate wallet support never asks for a seed phrase."
  },
  {
    id: "private-key-request",
    title: "Mentions private key",
    severity: "critical",
    scoreImpact: 55,
    pattern: /\b(private key|export key)\b/i,
    explanation: "Private keys must never be shared or entered into support forms."
  },
  {
    id: "wallet-validation",
    title: "Fake wallet validation language",
    severity: "high",
    scoreImpact: 35,
    pattern:
      /\b(validate|synchronize|sync|restore|rectify|verify).{0,60}\b(wallet|account|address|phrase|access)\b/i,
    explanation: "Scam messages often claim a wallet must be validated, synchronized, or restored."
  },
  {
    id: "wallet-locked-blocked",
    title: "Wallet locked or blocked threat",
    severity: "high",
    scoreImpact: 35,
    pattern:
      /\b(wallet|account|funds?|assets?).{0,40}\b(locked|blocked|frozen|suspended|disabled|restricted)\b|\b(locked|blocked|frozen|suspended).{0,40}\b(wallet|account|funds?|assets?)\b/i,
    explanation:
      "Scams often claim your wallet is locked or frozen to create panic and pressure immediate action."
  },
  {
    id: "unblock-request",
    title: "Fake unblock or restore request",
    severity: "high",
    scoreImpact: 30,
    pattern:
      /\b(unblock|unlock|restore|reactivate|unsuspend).{0,60}\b(wallet|account|access|phrase|seed|funds?)\b/i,
    explanation:
      "Requests to unblock or unlock a wallet by entering credentials are a classic credential-harvesting scam."
  },
  {
    id: "urgent-claim",
    title: "Urgent claim language",
    severity: "high",
    scoreImpact: 28,
    // "airdrop" alone is not urgency language — only explicit deadline/pressure words are
    // Also catches "urgently" (common in translated scam messages)
    pattern: /\b(urgent(ly)?|limited time|expires?|claim now|reward)\b/i,
    explanation: "Urgency and rewards are common pressure tactics."
  },
  {
    id: "airdrop-mention",
    title: "Airdrop mentioned",
    severity: "low",
    scoreImpact: 5,
    pattern: /\bairdrop\b/i,
    explanation: "Airdrop language is sometimes used in scams but is also common in legitimate promotions."
  },
  {
    id: "fake-support",
    title: "Fake official support impersonation",
    severity: "high",
    scoreImpact: 30,
    pattern:
      /\b(telegram|discord|support agent|admin|moderator|official support|solana support|foundation|verified by|account.{0,20}suspend|suspend.{0,20}account|account will be)\b/i,
    explanation:
      "Scammers impersonate official support channels, foundations, or admins to create false legitimacy."
  },
  {
    id: "connect-claim-domain",
    title: "Connect wallet plus claim language",
    severity: "high",
    scoreImpact: 32,
    pattern: /\b(connect wallet|connect your wallet)\b[\s\S]{0,120}\b(claim|airdrop|reward)\b/i,
    explanation: "Unknown claim pages can request dangerous wallet permissions."
  },
  {
    id: "fake-migration",
    title: "Fake token migration or protocol upgrade",
    severity: "critical",
    scoreImpact: 50,
    pattern:
      /\b(migrate|migration|solana 2\.0|protocol upgrade|setauthority|set authority|transfer.{0,30}control|full control.{0,30}token|token.{0,30}portfolio)\b/i,
    explanation:
      "Fake migration scams trick users into signing SetAuthority transactions that transfer full control of their token accounts to the attacker."
  },
  {
    id: "qr-urgency",
    title: "QR or payment urgency",
    severity: "medium",
    scoreImpact: 20,
    pattern: /\b(qr|scan|payment|deposit)\b[\s\S]{0,80}\b(now|urgent|expires)\b/i,
    explanation: "Payment requests combined with urgency should be reviewed carefully."
  },
  // ── URL / domain rules (language-agnostic — URLs appear verbatim regardless of message language) ──
  {
    id: "scam-in-url",
    title: "URL contains the word 'scam'",
    severity: "critical",
    scoreImpact: 60,
    pattern: /https?:\/\/[^\s]*scam[^\s]*/i,
    explanation:
      "A URL in this message literally contains the word 'scam'. No legitimate service uses such a domain."
  },
  {
    id: "wallet-brand-impersonation-url",
    title: "Wallet brand name used in unofficial URL",
    severity: "critical",
    scoreImpact: 55,
    pattern:
      /https?:\/\/(?!(?:phantom\.app|metamask\.io|solflare\.com|solana\.com|solana\.foundation))[^\s]*(phantom|metamask|solflare|solana-wallet|mysolana|\bsolana\b)[^\s]*/i,
    explanation:
      "A well-known wallet brand (Phantom, MetaMask, Solflare, Solana) appears inside a URL that is not the official domain. Impersonation phishing sites copy brand names to appear legitimate."
  },
  {
    id: "phishing-tld",
    title: "URL uses a free or high-abuse TLD",
    severity: "high",
    scoreImpact: 35,
    pattern: /https?:\/\/[^\s]+\.(tk|ml|ga|cf|gq|xyz|top|click|link|ru|cn)(?:[/?#\s]|$)/i,
    explanation:
      "The URL uses a free or heavily-abused top-level domain (.tk, .ml, .ga, .cf, .gq, .xyz, .top, .click, .link, .ru, .cn) that is disproportionately associated with phishing sites."
  },
  {
    id: "verify-seed-url",
    title: "Seed/wallet verification in URL path",
    severity: "critical",
    scoreImpact: 55,
    pattern:
      /https?:\/\/[^\s]*(verify|validate|confirm|restore|sync)[^\s]*(wallet|seed|phrase|account|token)[^\s]*/i,
    explanation:
      "The URL path contains words like 'verify' or 'validate' combined with 'wallet' or 'seed', which is a hallmark of phishing pages that harvest recovery phrases."
  }
];

export function evaluateScamText(text: string): RiskFinding[] {
  const input = text.slice(0, 10_000);
  return rules
    .filter((rule) => {
      if (!rule.pattern.test(input)) return false;
      if (!rule.negatedBy) return true;
      // For rules with a negation guard, check every match in context.
      // If ALL occurrences of the pattern are preceded by a negation phrase, suppress the rule.
      const globalPattern = new RegExp(
        rule.pattern.source,
        rule.pattern.flags.includes("g") ? rule.pattern.flags : rule.pattern.flags + "g"
      );
      const matches = [...input.matchAll(globalPattern)];
      const hasNonNegatedMatch = matches.some((match) => {
        const lookbackStart = Math.max(0, (match.index ?? 0) - 60);
        const precedingText = input.slice(lookbackStart, match.index ?? 0);
        return !rule.negatedBy!.test(precedingText);
      });
      return hasNonNegatedMatch;
    })
    .map((rule) => ({
      id: rule.id,
      title: rule.title,
      severity: rule.severity,
      scoreImpact: rule.scoreImpact,
      explanation: rule.explanation,
      evidence: [input.match(rule.pattern)?.[0] ?? rule.title]
    }));
}
