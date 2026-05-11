"use client";

import { Suspense, useState } from "react";
import Header from "@/components/layout/Header";
import Hero from "@/components/layout/Hero";
import TabBar, { type Tab, TABS } from "@/components/layout/TabBar";
import Footer from "@/components/layout/Footer";
import TransactionAnalyzer from "@/components/features/transaction";
import ScreenshotScanner from "@/components/features/scan";
import WalletAnalyzer from "@/components/features/wallet";
import HowItWorks from "@/components/features/how";
import Roadmap from "@/components/features/roadmap";
import OfflineBanner from "@/components/layout/OfflineBanner";

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("transaction");

  return (
    <main className="min-h-screen">
      <Header />
      <OfflineBanner />
      <Hero />
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

      <section
        className="mx-auto max-w-7xl px-5 py-8 md:px-8"
        aria-label={TABS.find((t) => t.id === activeTab)?.label}
      >
        <div className={activeTab === "transaction" ? undefined : "hidden"}>
          <Suspense>
            <TransactionAnalyzer />
          </Suspense>
        </div>
        <div className={activeTab === "screenshot" ? undefined : "hidden"}>
          <ScreenshotScanner />
        </div>
        <div className={activeTab === "wallet" ? undefined : "hidden"}>
          <WalletAnalyzer onOpenTransaction={() => setActiveTab("transaction")} />
        </div>
        {activeTab === "how" && <HowItWorks />}
        {activeTab === "roadmap" && <Roadmap />}
      </section>

      <Footer />
    </main>
  );
}
