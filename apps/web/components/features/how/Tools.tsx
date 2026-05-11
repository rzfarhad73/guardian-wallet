import { ArrowRight } from "lucide-react";
import Card from "@/components/ui/Card";
import { TOOLS } from "./data";

export default function Tools() {
  return (
    <div>
      <h3 className="text-foreground text-2xl font-bold">Three tools. One pipeline.</h3>
      <p className="text-muted mt-2 text-base leading-7">
        Each tool runs the same core pipeline: deterministic parsing → risk rule engine → local LLM
        explanation.
      </p>
      <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          return (
            <Card key={tool.title}>
              <div className="bg-primary text-primary-fg flex h-12 w-12 items-center justify-center rounded-lg">
                <Icon size={tool.iconSize} />
              </div>
              <h4 className="text-foreground mt-5 text-xl font-semibold">{tool.title}</h4>
              <p className="text-muted mt-2 text-base leading-7">{tool.description}</p>
              <ul className="mt-5 space-y-2">
                {tool.details.map((d) => (
                  <li key={d} className="text-muted flex items-start gap-2 text-sm leading-6">
                    <ArrowRight size={14} className="text-primary mt-0.5 shrink-0" />
                    {d}
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
