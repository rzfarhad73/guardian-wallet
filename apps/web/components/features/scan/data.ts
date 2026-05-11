export const SAMPLES = [
  { label: "Phantom alert", file: "01-phantom-security-alert.png", scam: true },
  { label: "Fake airdrop", file: "02-fake-airdrop-claim.png", scam: true },
  { label: "Telegram DM", file: "03-fake-telegram-dm.png", scam: true },
  { label: "dApp approval", file: "04-fake-dapp-approval.png", scam: true },
  { label: "Phishing email", file: "05-phishing-email.png", scam: true },
  { label: "🇷🇺 Russian scam", file: "07-russian-scam-dm.png", scam: true },
  { label: "🇪🇸 Spanish airdrop", file: "08-spanish-airdrop-scam.png", scam: true },
  { label: "🇨🇳 Chinese drain", file: "09-chinese-wallet-drain.png", scam: true },
  { label: "Legit transfer", file: "06-clean-legit-transfer.png", scam: false }
] as const;

export const TEXT_SAMPLES = [
  {
    label: "🇹🇷 Turkish",
    scam: true,
    text: "ACİL: Phantom cüzdanınız risk altında! Varlıklarınızı korumak için 24 saat içinde tohumunuzu doğrulayın. Şimdi tıklayın: https://phantom-verify.scam.tk"
  },
  {
    label: "🇷🇺 Russian",
    scam: true,
    text: "СРОЧНО: Ваш кошелёк Solana заблокирован из-за подозрительной активности. Введите сид-фразу для разблокировки: https://solana-unlock.ru"
  },
  {
    label: "🇪🇸 Spanish",
    scam: true,
    text: "¡ALERTA! Tu cartera Phantom ha sido comprometida. Actúa ahora para reclamar tus fondos y evitar pérdida permanente: https://phantom-claim.xyz"
  },
  {
    label: "🇨🇳 Chinese",
    scam: true,
    text: "紧急通知：您的 Solana 钱包存在安全风险。请立即验证您的助记词以保护资产：https://wallet-verify.cn"
  },
  {
    label: "🇸🇦 Arabic",
    scam: true,
    text: "تنبيه عاجل: محفظتك على Solana في خطر. أدخل عبارة الاسترداد الآن لتجنب فقدان أموالك: https://solana-secure.ar"
  },
  {
    label: "Legit transfer",
    scam: false,
    text: "You sent 2.5 SOL to wallet 7xKX...4mPQ. Transaction confirmed on Solana mainnet. View on Solscan: https://solscan.io/tx/5h3k..."
  },
  {
    label: "Legit airdrop",
    scam: false,
    text: "Your Jupiter airdrop of 200 JUP tokens is ready to claim at jup.ag/airdrop. No seed phrase or wallet connection required beyond approving the claim transaction."
  }
] as const;
