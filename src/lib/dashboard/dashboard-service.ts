import { subDays } from "date-fns";

import { isHighPriority } from "@/lib/constants";
import { toFeedbackDTO } from "@/lib/feedback-mappers";
import { prisma } from "@/lib/prisma";
import { getStaleTickets } from "@/lib/tickets/ticket-service";
import { getWorkspaceIdOrThrow } from "@/lib/workspace/workspace";
import type { DashboardMetrics, FeedbackDTO, TrendPoint } from "@/lib/types";

type DashboardData = {
  feedback: FeedbackDTO[];
  metrics: DashboardMetrics;
  trend: TrendPoint[];
  staleTickets: FeedbackDTO[];
};

function getTopKey<T extends string>(items: T[]): T | "None" {
  if (!items.length) return "None";
  const counts = items.reduce<Record<string, number>>((accumulator, current) => {
    accumulator[current] = (accumulator[current] ?? 0) + 1;
    return accumulator;
  }, {});
  const [top] = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return (top?.[0] as T | undefined) ?? "None";
}

function buildTrend(feedback: FeedbackDTO[]): TrendPoint[] {
  const days = 14;
  const map = new Map<
    string,
    { opened: number; resolved: number; highPriority: number; negative: number }
  >();
  for (let i = days - 1; i >= 0; i -= 1) {
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

export async function getDashboardData(): Promise<DashboardData> {
  const workspaceId = await getWorkspaceIdOrThrow();
  const [records, staleTickets] = await Promise.all([
    prisma.feedback.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      take: 400,
    }),
    getStaleTickets(5),
  ]);

  const feedback = records.map(toFeedbackDTO);

  const metrics: DashboardMetrics = {
    total: feedback.length,
    highPriority: feedback.filter((item) => isHighPriority(item.priority)).length,
    negativeCount: feedback.filter((item) => item.sentiment === "negative").length,
    topCategory: getTopKey(feedback.map((item) => item.category)),
    topTeam: getTopKey(feedback.map((item) => item.assignedTeam)),
  };

  return {
    feedback,
    metrics,
    trend: buildTrend(feedback),
    staleTickets,
  };
}
