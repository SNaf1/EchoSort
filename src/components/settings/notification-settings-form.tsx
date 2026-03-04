"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { upsertNotificationSettingsAction } from "@/app/actions/settings-actions";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  NotificationSettingsFormSchema,
  type NotificationSettings,
  type NotificationSettingsInput,
} from "@/lib/schemas/settings";

type NotificationSettingsFormProps = {
  initialSettings: NotificationSettings | null;
  onSaved?: () => void;
};

const fields = [
  { name: "engineeringEmail", label: "Engineering" },
  { name: "productEmail", label: "Product" },
  { name: "financeEmail", label: "Finance" },
  { name: "operationsEmail", label: "Operations" },
] as const;

export function NotificationSettingsForm({
  initialSettings,
  onSaved,
}: NotificationSettingsFormProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<NotificationSettingsInput>({
    resolver: zodResolver(NotificationSettingsFormSchema),
    defaultValues: {
      engineeringEmail: initialSettings?.engineeringEmail ?? "",
      productEmail: initialSettings?.productEmail ?? "",
      financeEmail: initialSettings?.financeEmail ?? "",
      operationsEmail: initialSettings?.operationsEmail ?? "",
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      try {
        await upsertNotificationSettingsAction(values);
        toast.success("Notification settings saved.");
        onSaved?.();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to save settings.");
      }
    });
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          {fields.map((fieldConfig) => (
            <FormField
              key={fieldConfig.name}
              control={form.control}
              name={fieldConfig.name}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{fieldConfig.label} Team Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={`${fieldConfig.label.toLowerCase()}@company.com`}
                      className="border-border/70 bg-background/70"
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={isPending} className="rounded-full px-5">
            {isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
            Save Settings
          </Button>
        </div>
      </form>
    </Form>
  );
}
