import { AlertCircle, Layers3, ShieldAlert, UsersRound } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardMetrics } from "@/lib/types";

type KpiCardsProps = {
  metrics: DashboardMetrics;
};

const cards = [
  {
    key: "total",
    title: "Total Feedback",
    icon: Layers3,
    extract: (metrics: DashboardMetrics) => metrics.total,
    note: "Captured tickets",
  },
  {
    key: "highPriority",
    title: "High Priority",
    icon: ShieldAlert,
    extract: (metrics: DashboardMetrics) => metrics.highPriority,
    note: "High, Urgent, Critical",
  },
  {
    key: "negativeCount",
    title: "Negative Sentiment",
    icon: AlertCircle,
    extract: (metrics: DashboardMetrics) => metrics.negativeCount,
    note: "Requires attention",
  },
  {
    key: "topSignals",
    title: "Top Signals",
    icon: UsersRound,
    extract: (metrics: DashboardMetrics) => `${metrics.topCategory} / ${metrics.topTeam}`,
    note: "Category / Team",
  },
] as const;

export function KpiCards({ metrics }: KpiCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((item) => (
        <Card key={item.key} className="glass-panel border-border/60 bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">{item.title}</CardTitle>
            <item.icon className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tracking-tight">{item.extract(metrics)}</p>
            <p className="mt-1 text-xs text-muted-foreground">{item.note}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
