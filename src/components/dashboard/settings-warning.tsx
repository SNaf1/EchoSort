import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

type SettingsWarningProps = {
  missingTeams: string[];
};

export function SettingsWarning({ missingTeams }: SettingsWarningProps) {
  return (
    <div className="glass-panel mb-4 flex flex-wrap items-center justify-between gap-4 border-amber-400/30 bg-amber-500/10 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-5 text-amber-700 dark:text-amber-300" />
        <div>
          <p className="font-medium text-amber-900 dark:text-amber-100">
            Email notifications are partially configured
          </p>
          <p className="text-sm text-amber-800/90 dark:text-amber-100/80">
            Missing recipients: {missingTeams.join(", ")}. Ticket creation still works, but routed
            notifications will be skipped.
          </p>
        </div>
      </div>
      <Button asChild variant="secondary" className="rounded-full">
        <Link href="/dashboard/settings">Open Settings</Link>
      </Button>
    </div>
  );
}
