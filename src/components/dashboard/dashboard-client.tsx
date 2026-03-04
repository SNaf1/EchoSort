"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

import { AgenticReminderCard } from "@/components/dashboard/agentic-reminder-card";
import { FirstRunSettingsModal } from "@/components/dashboard/first-run-settings-modal";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { SettingsWarning } from "@/components/dashboard/settings-warning";
import { FeedbackTable } from "@/components/dashboard/feedback-table";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { deriveDashboardMetrics, deriveTrend } from "@/lib/dashboard-client-utils";
import type { NotificationSettings } from "@/lib/schemas/settings";
import type { FeedbackDTO } from "@/lib/types";

type DashboardClientProps = {
  initialFeedback: FeedbackDTO[];
  staleTickets: FeedbackDTO[];
  initialSettings: NotificationSettings | null;
  settingsComplete: boolean;
  missingTeams: string[];
};

export function DashboardClient({
  initialFeedback,
  staleTickets,
  initialSettings,
  settingsComplete,
  missingTeams,
}: DashboardClientProps) {
  const computedMetrics = useMemo(() => deriveDashboardMetrics(initialFeedback), [initialFeedback]);
  const computedTrend = useMemo(() => deriveTrend(initialFeedback), [initialFeedback]);

  return (
    <div className="mx-auto w-full max-w-[96rem] px-4 py-8 sm:px-6 lg:px-8">
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mb-6 flex flex-wrap items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Feedback Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review AI-enriched tickets, filter signal, and route the roadmap.
          </p>
        </div>
      </motion.section>

      {!settingsComplete && <SettingsWarning missingTeams={missingTeams} />}

      <div className="space-y-4">
        <KpiCards metrics={computedMetrics} />
        <AgenticReminderCard staleTickets={staleTickets} />
        <FeedbackTable feedback={initialFeedback} />
        <TrendChart points={computedTrend} />
      </div>

      <FirstRunSettingsModal shouldShow={!settingsComplete} initialSettings={initialSettings} />
    </div>
  );
}
