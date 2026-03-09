"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Loader2, SlidersHorizontal, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { createFeedbackAction } from "@/app/actions/feedback-actions";
import { Badge } from "@/components/ui/badge";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { FEEDBACK_STAGED_MESSAGES } from "@/lib/constants";
import { FeedbackInputSchema } from "@/lib/schemas/feedback";

const SubmitFormSchema = FeedbackInputSchema.extend({
  environment: z.string().trim().max(120).optional(),
  expectedOutcome: z.string().trim().max(300).optional(),
  allowFollowup: z.boolean(),
});

type SubmitFormValues = z.infer<typeof SubmitFormSchema>;

const THINKING_INTERVAL_MS = 700;

function buildContextualMessage(values: SubmitFormValues) {
  const contextDetails = [
    values.environment ? `Environment: ${values.environment}` : null,
    values.expectedOutcome ? `Expected outcome: ${values.expectedOutcome}` : null,
  ].filter((line): line is string => Boolean(line));

  if (contextDetails.length === 0) return values.message;

  const combined = `${values.message}\n\n[Context]\n${contextDetails.join("\n")}`;
  if (combined.length <= 2000) return combined;
  return values.message;
}

export function SubmitPageClient() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);

  const form = useForm<SubmitFormValues>({
    resolver: zodResolver(SubmitFormSchema),
    defaultValues: {
      name: "",
      email: "",
      message: "",
      environment: "",
      expectedOutcome: "",
      allowFollowup: true,
    },
  });

  const stagedMessage = useMemo(
    () => FEEDBACK_STAGED_MESSAGES[stageIndex] ?? FEEDBACK_STAGED_MESSAGES[0],
    [stageIndex]
  );

  useEffect(() => {
    if (!isSubmitting) return;
    const interval = setInterval(() => {
      setStageIndex((index) => (index + 1) % FEEDBACK_STAGED_MESSAGES.length);
    }, THINKING_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isSubmitting]);

  const onSubmit = form.handleSubmit(async (values) => {
    setIsSubmitting(true);
    setStageIndex(0);
    const result = await createFeedbackAction({
      name: values.name,
      email: values.email,
      message: buildContextualMessage(values),
      allowFollowup: values.allowFollowup,
    });

    if (!result.ok) {
      if ("code" in result && result.code === "RATE_LIMITED") {
        toast.error(`Rate limit reached. Try again in ${result.retryAfterSeconds}s.`);
        setIsSubmitting(false);
        setStageIndex(0);
        return;
      }

      toast.error(result.error);
      if ("fieldErrors" in result && result.fieldErrors) {
        Object.entries(result.fieldErrors).forEach(([field, messages]) => {
          if (messages?.[0]) {
            form.setError(field as keyof SubmitFormValues, { message: messages[0] });
          }
        });
      }
      setIsSubmitting(false);
      return;
    }

    toast.success("Feedback submitted successfully.");
    form.reset({
      name: values.name,
      email: values.email,
      message: "",
      environment: "",
      expectedOutcome: "",
      allowFollowup: values.allowFollowup,
    });
    setIsSubmitting(false);
    setStageIndex(0);
  });

  return (
    <section className="relative isolate mx-auto w-full max-w-[96rem] px-4 py-8 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 left-[8%] h-64 w-64 rounded-full bg-emerald-500/25 blur-[100px]" />
        <div className="absolute top-1/3 right-[10%] h-80 w-80 rounded-full bg-cyan-500/20 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-zinc-300/25 blur-[120px] dark:bg-zinc-600/20" />
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[1.05fr_1.3fr]">
        <motion.aside
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="glass-panel border-border/60 bg-card/55 p-6 sm:p-8"
        >
          <Badge className="mb-4 rounded-full bg-primary/12 px-4 py-1.5 text-sm font-semibold text-primary dark:bg-primary/20">
            User Feedback Intelligence System
          </Badge>
          <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Share feedback with richer context.
          </h1>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            Add optional environment details and expected outcome. EchoSort uses them to improve
            category, priority, and team routing quality.
          </p>

          <div className="mt-6 space-y-2 text-sm text-muted-foreground">
            <p className="rounded-xl border border-border/70 bg-background/55 px-3 py-2">
              Structured AI enrichment before persistence.
            </p>
            <p className="rounded-xl border border-border/70 bg-background/55 px-3 py-2">
              Ticket appears instantly in dashboard views.
            </p>
            <p className="rounded-xl border border-border/70 bg-background/55 px-3 py-2">
              Optional email routing to mapped team inboxes.
            </p>
          </div>
        </motion.aside>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.34, delay: 0.05 }}
          className="glass-panel border-border/60 bg-card/58 p-6 sm:p-8"
        >
          <Form {...form}>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Jane Doe"
                          className="border-border/70 bg-background/70"
                          disabled={isSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="jane@company.com"
                          className="border-border/70 bg-background/70"
                          disabled={isSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Feedback</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe what happened, expected behavior, and impact."
                        className="min-h-36 border-border/70 bg-background/70"
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="environment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Environment (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Windows 11, Chrome 132"
                          className="border-border/70 bg-background/70"
                          disabled={isSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="expectedOutcome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expected Outcome (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Booking confirmation in one click"
                          className="border-border/70 bg-background/70"
                          disabled={isSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="allowFollowup"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-xl border border-border/60 bg-background/55 px-4 py-3">
                    <div>
                      <FormLabel className="text-sm">Allow follow-up contact</FormLabel>
                      <p className="text-xs text-muted-foreground">
                        Helps internal teams clarify details when needed.
                      </p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} disabled={isSubmitting} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                {isSubmitting ? (
                  <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1 text-xs text-muted-foreground">
                    <Sparkles className="size-3.5 text-primary" />
                    {stagedMessage}
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                    <SlidersHorizontal className="size-3.5" />
                    Optional environment details enrich downstream AI routing quality.
                  </div>
                )}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-full px-6 shadow-[0_0_30px_rgba(109,239,210,0.22)]"
                >
                  {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Submit Feedback
                </Button>
              </div>
            </form>
          </Form>
        </motion.div>
      </div>
    </section>
  );
}
