import { subDays } from "date-fns";

import { isHighPriority } from "@/lib/constants";
import type { DashboardMetrics, FeedbackDTO, TrendPoint } from "@/lib/types";

function getTopKey(items: string[]): string {
  if (!items.length) return "None";
  const counts = items.reduce<Record<string, number>>((accumulator, current) => {
    accumulator[current] = (accumulator[current] ?? 0) + 1;
    return accumulator;
  }, {});
  const [top] = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return top?.[0] ?? "None";
}

export function deriveDashboardMetrics(feedback: FeedbackDTO[]): DashboardMetrics {
  return {
    total: feedback.length,
    highPriority: feedback.filter((item) => isHighPriority(item.priority)).length,
    negativeCount: feedback.filter((item) => item.sentiment === "negative").length,
    topCategory: getTopKey(feedback.map((item) => item.category)) as DashboardMetrics["topCategory"],
    topTeam: getTopKey(feedback.map((item) => item.assignedTeam)) as DashboardMetrics["topTeam"],
  };
}

export function deriveTrend(feedback: FeedbackDTO[]): TrendPoint[] {
  const map = new Map<
    string,
    { opened: number; resolved: number; highPriority: number; negative: number }
  >();
  for (let i = 13; i >= 0; i -= 1) {
    const key = subDays(new Date(), i).toISOString().slice(0, 10);
    map.set(key, { opened: 0, resolved: 0, highPriority: 0, negative: 0 });
  }

  for (const item of feedback) {
    const createdKey = item.createdAt.slice(0, 10);
    const createdBucket = map.get(createdKey);
    if (createdBucket) {
      createdBucket.opened += 1;
      if (isHighPriority(item.priority)) createdBucket.highPriority += 1;
      if (item.sentiment === "negative") createdBucket.negative += 1;
    }

    if (item.resolvedAt) {
      const resolvedKey = item.resolvedAt.slice(0, 10);
      const resolvedBucket = map.get(resolvedKey);
      if (resolvedBucket) {
        resolvedBucket.resolved += 1;
      }
    }
  }

  return Array.from(map.entries()).map(([x, values]) => ({
    x,
    opened: values.opened,
    resolved: values.resolved,
    highPriority: values.highPriority,
    negative: values.negative,
  }));
}
