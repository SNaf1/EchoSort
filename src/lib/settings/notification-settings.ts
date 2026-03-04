import type { Team } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  type NotificationSettings,
  type NotificationSettingsInput,
  NotificationSettingsSchema,
  isNotificationSettingsComplete,
} from "@/lib/schemas/settings";
import { getWorkspaceIdOrThrow } from "@/lib/workspace/workspace";

export type NotificationSettingsState = {
  settings: NotificationSettings | null;
  isComplete: boolean;
  missingTeams: Team[];
};

function getMissingTeams(settings: NotificationSettings | null): Team[] {
  if (!settings) return ["Engineering", "Product", "Finance", "Operations"];
  const missing: Team[] = [];
  if (!settings.engineeringEmail) missing.push("Engineering");
  if (!settings.productEmail) missing.push("Product");
  if (!settings.financeEmail) missing.push("Finance");
  if (!settings.operationsEmail) missing.push("Operations");
  return missing;
}

export async function getNotificationSettingsState(): Promise<NotificationSettingsState> {
  const workspaceId = await getWorkspaceIdOrThrow();
  const record = await prisma.notificationSettings.findUnique({
    where: { workspaceId },
  });

  const settings = record
    ? ({
        engineeringEmail: record.engineeringEmail,
        productEmail: record.productEmail,
        operationsEmail: record.operationsEmail,
        financeEmail: record.financeEmail,
      } satisfies NotificationSettings)
    : null;

  return {
    settings,
    isComplete: isNotificationSettingsComplete(settings),
    missingTeams: getMissingTeams(settings),
  };
}

export async function upsertNotificationSettings(
  input: NotificationSettingsInput
): Promise<NotificationSettingsState> {
  const workspaceId = await getWorkspaceIdOrThrow();
  const parsed = NotificationSettingsSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid notification settings.");
  }

  await prisma.notificationSettings.upsert({
    where: { workspaceId },
    create: {
      workspaceId,
      ...parsed.data,
    },
    update: {
      ...parsed.data,
    },
  });

  return getNotificationSettingsState();
}

export function resolveTeamRecipient(
  team: Team,
  settings: NotificationSettings | null
): string | null {
  if (!settings) return null;
  if (team === "Engineering") return settings.engineeringEmail;
  if (team === "Product") return settings.productEmail;
  if (team === "Finance") return settings.financeEmail;
  return settings.operationsEmail;
}
