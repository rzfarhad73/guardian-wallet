import { CheckCircle2, Circle, Clock, Zap } from "lucide-react";
import { PHASE_STATUS } from "./types";
import type { PhaseStatus, StatusMeta } from "./types";

export const STATUS_MAP: Record<PhaseStatus, StatusMeta> = {
  [PHASE_STATUS.SHIPPED]: {
    label: "Shipped",
    icon: CheckCircle2,
    className: "text-green-600 dark:text-green-400",
    dotClass: "bg-green-500"
  },
  [PHASE_STATUS.ACTIVE]: {
    label: "In progress",
    icon: Zap,
    className: "text-primary",
    dotClass: "bg-primary animate-pulse"
  },
  [PHASE_STATUS.PLANNED]: {
    label: "Planned",
    icon: Clock,
    className: "text-yellow-600 dark:text-yellow-400",
    dotClass: "bg-yellow-500"
  },
  [PHASE_STATUS.FUTURE]: {
    label: "Future",
    icon: Circle,
    className: "text-muted",
    dotClass: "bg-border"
  }
};
