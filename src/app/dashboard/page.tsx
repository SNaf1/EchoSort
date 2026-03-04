import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { getDashboardData } from "@/lib/dashboard/dashboard-service";
import { getNotificationSettingsState } from "@/lib/settings/notification-settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [dashboardData, settingsState] = await Promise.all([
    getDashboardData(),
    getNotificationSettingsState(),
  ]);

  return (
    <DashboardClient
      initialFeedback={dashboardData.feedback}
      staleTickets={dashboardData.staleTickets}
      initialSettings={settingsState.settings}
      settingsComplete={settingsState.isComplete}
      missingTeams={settingsState.missingTeams}
    />
  );
}
