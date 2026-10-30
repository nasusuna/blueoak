import type { PmdStatus } from "@service-app/core";
import { cn } from "@/lib/utils";

const label: Record<PmdStatus, string> = {
  overdue: "Overdue",
  due: "Due soon",
  scheduled: "Scheduled",
  completed: "Completed",
};

const tone: Record<PmdStatus, string> = {
  overdue: "bg-destructive/10 text-destructive",
  due: "bg-warning text-warning-foreground",
  scheduled: "bg-secondary text-secondary-foreground",
  completed: "bg-success text-success-foreground",
};

export const StatusBadge = ({ status }: { status: PmdStatus }) => (
  <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-sm font-medium", tone[status])}>{label[status]}</span>
);

const visitLabel = {
  installation: "Installation",
  breakdown: "Breakdown",
  preventive: "Preventive",
} as const;

const visitTone = {
  installation: "bg-secondary text-secondary-foreground",
  preventive: "bg-success text-success-foreground",
  breakdown: "bg-destructive/10 text-destructive",
} as const;

export const VisitTypeBadge = ({ type }: { type: keyof typeof visitLabel }) => (
  <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-sm font-medium", visitTone[type])}>{visitLabel[type]}</span>
);
