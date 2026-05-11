import Logo from "@/components/ui/Logo";
import ThemeToggle from "@/components/ui/ThemeToggle";
import HeaderExtension from "@/components/layout/extension";

export default function Header() {
  return (
    <header className="border-border bg-surface border-b">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 md:px-8">
        <Logo variant="full" size="sm" />
        <div className="flex items-center gap-3">
          <HeaderExtension />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
