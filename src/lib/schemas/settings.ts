import { z } from "zod";

const optionalTeamEmailRaw = z
  .string()
  .trim()
  .max(150)
  .refine((value) => value.length === 0 || z.email().safeParse(value).success, {
    message: "Enter a valid email address.",
  });

export const NotificationSettingsFormSchema = z.object({
  engineeringEmail: optionalTeamEmailRaw,
  productEmail: optionalTeamEmailRaw,
  operationsEmail: optionalTeamEmailRaw,
  financeEmail: optionalTeamEmailRaw,
});

export const NotificationSettingsSchema = NotificationSettingsFormSchema.transform((value) => ({
  engineeringEmail: value.engineeringEmail.length ? value.engineeringEmail : null,
  productEmail: value.productEmail.length ? value.productEmail : null,
  operationsEmail: value.operationsEmail.length ? value.operationsEmail : null,
  financeEmail: value.financeEmail.length ? value.financeEmail : null,
}));

export type NotificationSettingsInput = z.input<typeof NotificationSettingsSchema>;
export type NotificationSettings = z.output<typeof NotificationSettingsSchema>;

export function isNotificationSettingsComplete(settings: NotificationSettings | null) {
  if (!settings) return false;
  return Boolean(
    settings.engineeringEmail &&
      settings.productEmail &&
      settings.operationsEmail &&
      settings.financeEmail
  );
}
