# Wallet Safety Rules

## Seed Phrases & Private Keys

- Never share your seed phrase, recovery phrase, mnemonic, or private key with anyone — ever.
- No legitimate wallet, exchange, protocol, or support agent will ever ask for your seed phrase.
- Browser extensions, websites, and dApps have no reason to request your private key.
- If a "support agent" asks for your recovery phrase in any channel (Discord, Telegram, Twitter DM, email), it is always a scam.

## Transaction Signing

- Never sign a transaction you don't understand. "Blind signing" is dangerous.
- A transaction can do more than it appears — always check the full list of instructions, not just the UI label.
- SetAuthority instructions permanently transfer control of a token account or mint. Only sign if you fully understand the destination.
- CloseAccount instructions send the token balance to a destination address. Verify that destination is yours before signing.
- Treat token delegate approvals as high risk unless you understand the spender and the amount limit.
- An Approve instruction with a very large or max (u64 max) amount grants unlimited spending permission — treat this as critical risk.
- If a transaction was presented with urgency or time pressure, slow down and verify it independently.
- Verify the destination address byte-for-byte before signing any transfer. Clipboard hijacking malware can silently replace copied addresses.

## Unknown Programs & dApps

- Review unknown programs carefully. Unknown does not automatically mean malicious, but it warrants caution.
- A legitimate dApp should be verifiable through its official website, docs, and on-chain program ID.
- Avoid connecting your wallet to websites you arrived at through unsolicited links, QR codes, or DMs.
- WalletConnect QR codes and deep links can connect your wallet to malicious dApps — only use them from trusted sources.

## Social Engineering & Impersonation

- Be skeptical of urgent airdrops, refund portals, wallet validation pages, and fake support accounts.
- Scammers impersonate founders, official teams, Discord moderators, Telegram admins, and exchange support.
- "Limited time", "expires soon", "claim now", and "last chance" are pressure tactics designed to prevent careful thought.
- Official projects never DM users first about rewards, migrations, or security alerts.
- Fake governance votes, protocol upgrades, and migrations are used to trick users into signing approval or SetAuthority transactions.

## Token & Asset Safety

- Receiving unexpected tokens or tiny SOL amounts (dust) is a known tactic to identify active wallets for follow-up phishing.
- Do not interact with (swap, transfer, or click links in) unknown airdropped tokens — they may trigger malicious contract calls.
- Verify token mint addresses against official sources. Lookalike token names (e.g. fake USDC) with different mint addresses are a common scam.
- Tokens promising guaranteed returns, "100x", or insider presales should be treated as likely scams or rug pulls.
- NFT free mints may embed approval or SetAuthority instructions alongside the mint instruction.

## Account Recovery & Support

- No legitimate recovery service can restore a compromised wallet without your seed phrase.
- Any "wallet rescue" service that asks for your seed phrase or private key is stealing your funds.
- Never install remote desktop software (AnyDesk, TeamViewer) at a support agent's request — this is a known scam vector.
- If your wallet has been compromised, move remaining assets to a new wallet immediately using a clean device.

## General

- Guardian is a safety assistant, not a guarantee. Always verify transactions and never share your seed phrase or private key.
- Use hardware wallets for large holdings. Software wallets on internet-connected devices are always higher risk.
- Keep your OS and wallet software updated to reduce exposure to known vulnerabilities.
