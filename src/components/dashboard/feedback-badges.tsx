import { AlertTriangle, Bug, Building2, CircleDashed, Smile, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type SentimentBadgeProps = { value: "positive" | "neutral" | "negative" };
type PriorityBadgeProps = { value: "Low" | "Medium" | "High" | "Urgent" | "Critical" };
type CategoryBadgeProps = { value: "Bug" | "Feature" | "UI" | "Billing" | "Other" };
type TeamBadgeProps = { value: "Engineering" | "Product" | "Finance" | "Operations" };
type StatusBadgeProps = { value: "New" | "InProgress" | "Pending" | "Resolved" | "Closed" };

export function SentimentBadge({ value }: SentimentBadgeProps) {
  const styles =
    value === "positive"
      ? "border-emerald-500/35 bg-emerald-500/12 text-emerald-800 dark:text-emerald-300"
      : value === "negative"
        ? "border-rose-500/35 bg-rose-500/12 text-rose-800 dark:text-rose-300"
        : "border-zinc-500/35 bg-zinc-500/10 text-zinc-700 dark:text-zinc-300";

  const Icon = value === "positive" ? Smile : value === "negative" ? AlertTriangle : CircleDashed;

  return (
    <Badge variant="outline" className={cn("gap-1.5 border", styles)}>
      <Icon className="size-3" />
      {value}
    </Badge>
  );
}

export function PriorityBadge({ value }: PriorityBadgeProps) {
  const styles =
    value === "Critical"
      ? "border-rose-500/35 bg-rose-500/15 text-rose-800 dark:text-rose-300"
      : value === "Urgent"
        ? "border-orange-500/35 bg-orange-500/15 text-orange-800 dark:text-orange-300"
        : value === "High"
          ? "border-amber-500/35 bg-amber-500/15 text-amber-800 dark:text-amber-300"
          : value === "Medium"
            ? "border-cyan-500/35 bg-cyan-500/15 text-cyan-800 dark:text-cyan-300"
            : "border-teal-500/35 bg-teal-500/12 text-teal-800 dark:text-teal-300";
  return (
    <Badge variant="outline" className={cn("border font-mono", styles)}>
      {value}
    </Badge>
  );
}

export function CategoryBadge({ value }: CategoryBadgeProps) {
  const icon =
    value === "Bug" ? (
      <Bug className="size-3" />
    ) : value === "Feature" ? (
      <Sparkles className="size-3" />
    ) : value === "Billing" ? (
      <Building2 className="size-3" />
    ) : (
      <CircleDashed className="size-3" />
    );

  return (
    <Badge variant="secondary" className="gap-1.5 bg-secondary/70 text-secondary-foreground">
      {icon}
      {value}
    </Badge>
  );
}

export function TeamBadge({ value }: TeamBadgeProps) {
  return (
    <Badge
      variant="outline"
      className="border-emerald-500/40 bg-emerald-500/12 text-emerald-800 shadow-[0_0_12px_rgba(95,242,208,0.12)] dark:text-emerald-300"
    >
      {value}
    </Badge>
  );
}

export function StatusBadge({ value }: StatusBadgeProps) {
  const styles =
    value === "Closed"
      ? "border-zinc-500/35 bg-zinc-500/10 text-zinc-700 dark:text-zinc-300"
      : value === "Resolved"
        ? "border-emerald-500/35 bg-emerald-500/12 text-emerald-800 dark:text-emerald-300"
        : value === "Pending"
          ? "border-amber-500/35 bg-amber-500/12 text-amber-800 dark:text-amber-300"
          : value === "InProgress"
            ? "border-cyan-500/35 bg-cyan-500/12 text-cyan-800 dark:text-cyan-300"
            : "border-violet-500/35 bg-violet-500/12 text-violet-800 dark:text-violet-300";
  const label = value === "InProgress" ? "In Progress" : value;
  return (
    <Badge variant="outline" className={cn("border", styles)}>
      {label}
    </Badge>
  );
}
