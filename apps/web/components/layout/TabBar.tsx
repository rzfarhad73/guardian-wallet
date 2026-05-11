export type Tab = "transaction" | "screenshot" | "wallet" | "how" | "roadmap";

export const TABS: Array<{ id: Tab; label: string }> = [
  { id: "transaction", label: "Transaction Analyzer" },
  { id: "screenshot", label: "Screenshot Scanner" },
  { id: "wallet", label: "Wallet Profile" },
  { id: "how", label: "How It Works" },
  { id: "roadmap", label: "Roadmap" }
];

interface TabBarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export default function TabBar({ activeTab, onTabChange }: TabBarProps) {
  return (
    <section className="border-border bg-surface border-y">
      <div
        className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-5 py-3 md:px-8"
        role="tablist"
        aria-label="Guardian features"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`focus-visible:ring-primary h-10 shrink-0 rounded-md px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 ${
              activeTab === tab.id
                ? "bg-primary text-primary-fg"
                : "bg-surface text-foreground hover:bg-surface-hover"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </section>
  );
}
