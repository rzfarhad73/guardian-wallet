import { GuardianIcon } from "@/components/ui/Logo";
import StatusBanner from "@/components/features/status";

export default function Hero() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-8 md:px-8 md:py-12">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-end">
        <div>
          <div className="border-border bg-surface text-foreground inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium dark:ring-1 dark:ring-white/10">
            <GuardianIcon width={16} height={16} />
            Private transaction firewall for Solana wallets
          </div>
          <h1 className="text-foreground mt-6 max-w-4xl text-5xl font-bold tracking-normal md:text-7xl">
            Guardian Wallet Firewall
          </h1>
          <p className="text-foreground mt-5 max-w-3xl text-2xl font-semibold">
            Know what you hold. Detect what&apos;s dangerous. Act without leaking your intent.
          </p>
          <p className="text-muted mt-4 max-w-3xl text-lg leading-8">
            Guardian uses local AI through QVAC to explain transactions, scan scam screenshots, detect
            wallet-drainer delegates, and prepare protective actions. No wallet data, screenshots, or trading
            intent is sent to any cloud model.
          </p>
        </div>
        <StatusBanner />
      </div>
    </section>
  );
}
