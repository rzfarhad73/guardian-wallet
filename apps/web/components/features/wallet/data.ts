export const WALLET_SAMPLES: { label: string; address: string; scam: boolean; description: string }[] = [
  {
    label: "Regular wallet",
    address: "GThUX1Atko4tqhN2NaiTazWSeFWMuiUvfFnyJyUghFMJ",
    scam: false,
    description: "Typical personal wallet — moderate SOL balance, a handful of token accounts"
  },
  {
    label: "Coinbase Hot Wallet",
    address: "H8sMJSCQxfKiFTCfDR3DUMLPwcRbM61LGFJ8N4dK3WjS",
    scam: false,
    description: "High-volume exchange wallet — many transfers, large balance"
  },
  {
    label: "Binance Hot Wallet",
    address: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
    scam: false,
    description: "Major exchange hot wallet — very high SOL balance and token account count"
  },
  {
    label: "Active delegates",
    address: "CuieVDEDtLo7FypA9SbLM9saXFdb1dsshEkyErMqkRQq",
    scam: false,
    description:
      "Has active token delegates set on SRM and STEP accounts — the same mechanism used by wallet drainers"
  },
  {
    label: "Wormhole exploiter",
    address: "Htp9MGP8Tig923ZFY7Qf2zzbMUmYneFRAhSp7vSg4wxV",
    scam: true,
    description: "Address that received ~120k wSOL in the Feb 2022 Wormhole bridge exploit"
  }
];
