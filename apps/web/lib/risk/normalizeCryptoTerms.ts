type NormalizationRule = [RegExp, string];

const RULES: NormalizationRule[] = [
  // ── Seed / recovery phrase ──────────────────────────────────────────────
  // Arabic NMT: عبارة الاسترداد → "redemption phrase" (should be "recovery phrase")
  [/\bredemption\s+phrase\b/gi, "recovery phrase"],
  // Arabic/other NMT: "restoration phrase", "retrieval phrase" for recovery phrase
  [/\b(?:restoration|retrieval)\s+phrase\b/gi, "recovery phrase"],
  // Chinese NMT: 助记词 → "menograms", "memorograms", "memonics", "aide-memoire words"
  [/\bmenograms?\b/gi, "mnemonic"],
  [/\bmemorogram\b/gi, "mnemonic"],
  [/\bmemonics?\b/gi, "mnemonic"],
  // Generic: "password phrase", "passphrase phrase" sometimes appears as NMT artefact
  [/\bpassword\s+phrase\b/gi, "seed phrase"],
  // Fallback for when NMT is unavailable: well-known seed phrase translations
  // that appear verbatim in the source text and aren't translated at all.
  // Spanish: frase semilla / frase de semilla
  [/\bfrase\s+(?:de\s+)?semilla\b/gi, "seed phrase"],
  // Russian: сид-фраза / сид фраза / сидфраза
  [/\bсид[\s-]?фраз[аыу]\b/gi, "seed phrase"],
  // Turkish: tohum ifadesi / kurtarma ifadesi
  [/\btohum\s+ifadesi\b/gi, "seed phrase"],
  [/\bkurtarma\s+ifadesi\b/gi, "recovery phrase"],

  // ── Private key ─────────────────────────────────────────────────────────
  // Some NMT models output "secret key" for private key in certain languages
  // (this is also a valid synonym so safe to normalize)
  [/\bsecret\s+key\b/gi, "private key"],

  // ── Bergamot Russian → EN artefacts ─────────────────────────────────────
  // сид-фразу / Se-phrase / Ced-phrase / Sed-phrase (Bergamot misread)
  [/\b[SC]e[d]?[\s-]phrase\b/gi, "seed phrase"],
  // кошелёк → "purse" (Bergamot picks the wrong translation)
  [/\byour\s+purse\b/gi, "your wallet"],
  [/\bthe\s+purse\b/gi, "the wallet"],
  // подозрительная активность → "Surprising Activism" (wrong register)
  [/\bsurprising\s+activism\b/gi, "suspicious activity"],
  // заблокирован / заморожены MT variants
  [/\bwill\s+(?:be\s+)?froze\b/gi, "will be frozen"],
  [/\bwill\s+froze\b/gi, "will be frozen"]
];

export function normalizeCryptoTerms(text: string): string {
  // First: collapse spaces that OCR inserts into URLs
  // e.g. "https:/ /wallet-verify.cn /verify" → "https://wallet-verify.cn/verify"
  let normalized = text
    .replace(/https?:\/\s+\//gi, (m) => m.replace(/\s+/g, ""))
    .replace(/(https?:\/\/[^\s]+)\s+(\S)/g, (_, url, next) =>
      /^[/?#]/.test(next) ? url + next : url + " " + next
    );
  for (const [pattern, replacement] of RULES) {
    normalized = normalized.replace(pattern, replacement);
  }

  // Sanitize OCR artifacts line-by-line.
  // $* is an unmistakable sign the recogniser badly garbled the image text.
  // The preceding whitespace-separated token is almost certainly also garbled
  // (e.g. OCR reads "0.5 SOL" as "7OS $*0"). Replace both tokens together so
  // the LLM sees "[amount unclear]" instead of a confidently-stated wrong value.
  normalized = normalized
    .split("\n")
    .map((line) =>
      line
        // Strong: preceding token + $*-containing token → [amount unclear]
        .replace(/(\S{1,10})[^\S\n]+(\S*\$\*\S*|\S*\*\$\S*)/g, (match, _prev, garbled) =>
          garbled.length <= 12 ? "[amount unclear]" : match
        )
        // Weaker: any remaining lone *-containing short token → [?]
        .replace(/\S*\*\S*/g, (m) => (m.length <= 10 ? "[?]" : m))
    )
    .join("\n");

  return normalized;
}
