import { type LucideIcon } from "lucide-react";

type Props = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export default function Card({ icon: Icon, title, description }: Props) {
  return (
    <div className="border-border bg-surface-raised rounded-lg border p-4">
      <div className="flex items-center gap-2">
        <Icon size={16} className="text-primary shrink-0" />
        <span className="text-foreground text-sm font-semibold">{title}</span>
      </div>
      <p className="text-muted mt-1.5 text-xs leading-relaxed">{description}</p>
    </div>
  );
}
