import Card from "@/components/ui/Card";

export default function Footer() {
  return (
    <section className="mx-auto max-w-7xl px-5 pb-10 md:px-8">
      <Card className="text-muted text-sm">
        Guardian is a safety assistant, not a guarantee. Always verify transactions and never share your seed
        phrase or private key.
      </Card>
    </section>
  );
}
