import type { Metadata, Viewport } from "next";
import RegisterServiceWorker from "@/components/features/pwa/RegisterServiceWorker";
import "./globals.css";
import "./theme.css";

export const metadata: Metadata = {
  title: "Guardian Wallet Firewall",
  description: "Local AI safety layer for Solana wallets using QVAC.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Guardian"
  }
};

export const viewport: Viewport = {
  themeColor: "#0d9e7e",
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  viewportFit: "cover"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t!=='light')document.documentElement.classList.add('dark')}catch(e){}})();`
          }}
        />
        <meta name="description" content="Local AI safety layer for Solana wallets using QVAC." />
      </head>
      <body suppressHydrationWarning>
        {children}
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
