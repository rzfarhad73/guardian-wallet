import type { LucideIcon } from "lucide-react";

export const PHASE_STATUS = {
  SHIPPED: "SHIPPED",
  ACTIVE: "ACTIVE",
  PLANNED: "PLANNED",
  FUTURE: "FUTURE"
} as const;

export type PhaseStatus = (typeof PHASE_STATUS)[keyof typeof PHASE_STATUS];

export type Milestone = {
  title: string;
  done?: boolean;
};

export type Phase = {
  phase: string;
  label: string;
  status: PhaseStatus;
  headline: string;
  milestones: Milestone[];
};

export type StatusMeta = {
  label: string;
  icon: LucideIcon;
  className: string;
  dotClass: string;
};
