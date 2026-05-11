import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Guardian Wallet Firewall",
    short_name: "Guardian",
    description: "Local AI safety layer for Solana wallets — powered by QVAC.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f4f6f9",
    theme_color: "#0d9e7e",
    categories: ["finance", "security", "utilities"],
    icons: [
      { src: "/icon/small", sizes: "32x32", type: "image/png" },
      { src: "/icon/medium", sizes: "192x192", type: "image/png" },
      { src: "/icon/large", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon/large", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" }
    ]
  };
}
