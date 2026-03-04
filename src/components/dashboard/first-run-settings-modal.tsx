"use client";

import { useState } from "react";

import { NotificationSettingsForm } from "@/components/settings/notification-settings-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { NotificationSettings } from "@/lib/schemas/settings";

type FirstRunSettingsModalProps = {
  shouldShow: boolean;
  initialSettings: NotificationSettings | null;
};

export function FirstRunSettingsModal({
  shouldShow,
  initialSettings,
}: FirstRunSettingsModalProps) {
  const [open, setOpen] = useState(shouldShow);

  if (!shouldShow) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl border-border/70 bg-card/80 backdrop-blur-2xl">
        <DialogHeader>
          <DialogTitle className="font-mono tracking-[0.12em]">Notification Setup</DialogTitle>
          <DialogDescription>
            Configure team recipient emails now. You can dismiss this and continue, but notification
            emails will not send until configured.
          </DialogDescription>
        </DialogHeader>
        <NotificationSettingsForm initialSettings={initialSettings} onSaved={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
