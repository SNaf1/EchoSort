import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { NotificationSettingsForm } from "@/components/settings/notification-settings-form";
import { ThemeSettingsCard } from "@/components/settings/theme-settings-card";
import { WorkspaceControlsCard } from "@/components/settings/workspace-controls-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getNotificationSettingsState } from "@/lib/settings/notification-settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function DashboardSettingsPage() {
  const state = await getNotificationSettingsState();

  return (
    <div className="mx-auto w-full max-w-[96rem] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Workspace Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure notification routing and appearance preferences.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={state.isComplete ? "default" : "secondary"}
            className="rounded-full px-3 py-1"
          >
            {state.isComplete ? "Email Routing Ready" : "Email Routing Incomplete"}
          </Badge>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 size-4" />
              Back
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <div className="glass-panel border-border/60 bg-card/55 p-6 sm:p-8">
          <h2 className="text-base font-semibold">Team Email Routing</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure destination email inboxes for each routed team.
          </p>
          <div className="mt-5">
            <NotificationSettingsForm initialSettings={state.settings} />
          </div>
        </div>
        <div className="space-y-4">
          <ThemeSettingsCard />
          <WorkspaceControlsCard />
        </div>
      </div>
    </div>
  );
}
