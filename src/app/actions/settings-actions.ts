"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import type { NotificationSettingsInput } from "@/lib/schemas/settings";
import {
  getNotificationSettingsState,
  upsertNotificationSettings,
} from "@/lib/settings/notification-settings";
import { WORKSPACE_COOKIE_NAME } from "@/lib/workspace/workspace";

export async function getNotificationSettingsAction() {
  return getNotificationSettingsState();
}

export async function upsertNotificationSettingsAction(input: NotificationSettingsInput) {
  const result = await upsertNotificationSettings(input);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
  return result;
}

function generateWorkspaceId() {
  return crypto.randomUUID().replace(/-/g, "");
}

export async function rotateWorkspaceAction() {
  const workspaceId = generateWorkspaceId();
  const cookieStore = await cookies();

  cookieStore.set({
    name: WORKSPACE_COOKIE_NAME,
    value: workspaceId,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath("/submit");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
  return { workspaceId };
}
