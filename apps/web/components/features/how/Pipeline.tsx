import { ArrowRight } from "lucide-react";
import Card from "@/components/ui/Card";
import { PIPELINE } from "./data";

export default function Pipeline() {
  return (
    <div>
      <h3 className="text-foreground text-2xl font-bold">Analysis pipeline</h3>
      <p className="text-muted mt-2 text-base leading-7">
        Guardian is determinism-first. AI never produces the risk score. It only explains findings the rule
        engine already made.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PIPELINE.map((item, i) => (
          <Card key={item.step} className="relative">
            <div className="flex items-center gap-3">
              <div className="bg-primary text-primary-fg flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base font-bold">
                {item.step}
              </div>
              {i < PIPELINE.length - 1 && (
                <ArrowRight size={14} className="text-muted absolute -right-2.5 top-7 z-10 hidden lg:block" />
              )}
              <h4 className="text-foreground text-base font-semibold">{item.title}</h4>
            </div>
            <p className="text-muted mt-3 text-sm leading-6">{item.text}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
