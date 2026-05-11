"use client";

import { useEffect, useRef, useState } from "react";
import type { RiskAssessment, RiskLevel } from "@/lib/solana/types";
import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";

const levelClass: Record<RiskLevel, string> = {
  Low: "badge-low",
  Medium: "badge-medium",
  High: "badge-high",
  Critical: "badge-critical"
};

export default function Score({ assessment, loading }: { assessment?: RiskAssessment; loading?: boolean }) {
  const [displayScore, setDisplayScore] = useState(0);
  const [flash, setFlash] = useState(false);
  const rafRef = useRef<number | undefined>(undefined);
  const prevAssessmentRef = useRef<RiskAssessment | undefined>(undefined);

  useEffect(() => {
    if (!assessment) {
      setDisplayScore(0);
      return;
    }
    if (prevAssessmentRef.current !== assessment) {
      prevAssessmentRef.current = assessment;
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 800);
      const target = assessment.score;
      const start = performance.now();
      const duration = 700;
      function tick(now: number) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayScore(Math.round(eased * target));
        if (progress < 1) {
          rafRef.current = requestAnimationFrame(tick);
        }
      }
      rafRef.current = requestAnimationFrame(tick);
      return () => {
        clearTimeout(t);
        if (rafRef.current !== undefined) cancelAnimationFrame(rafRef.current);
      };
    }
  }, [assessment]);

  if (loading) {
    return (
      <Card>
        <div className="space-y-3">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      </Card>
    );
  }

  if (!assessment) {
    return (
      <Card>
        <p className="text-muted text-sm font-medium">Risk score</p>
        <p className="text-muted mt-2 text-3xl font-semibold">--</p>
        <p className="text-muted mt-2 text-xs">Run an analysis to see the risk score.</p>
      </Card>
    );
  }

  return (
    <Card
      className={`border transition-shadow duration-300 ${levelClass[assessment.level]} ${flash ? "ring-qvac-active ring-2 ring-offset-1" : ""}`}
    >
      <p className="text-sm font-semibold">Risk level</p>
      <div className="mt-2 flex items-end justify-between gap-4">
        <p className="text-4xl font-bold">{assessment.level}</p>
        <p className="text-3xl font-semibold">{displayScore}/100</p>
      </div>
      <p className="mt-3 text-sm">{assessment.deterministicSummary}</p>
    </Card>
  );
}
