"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Loader2, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { createFeedbackAction } from "@/app/actions/feedback-actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FEEDBACK_STAGED_MESSAGES } from "@/lib/constants";
import { FeedbackInputSchema, type FeedbackInput } from "@/lib/schemas/feedback";
import type { FeedbackDTO } from "@/lib/types";

type FeedbackModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOptimisticCreate?: (feedback: FeedbackDTO) => void;
  onCreated?: (tempId: string, feedback: FeedbackDTO) => void;
  onFailed?: (tempId: string) => void;
};

const THINKING_INTERVAL_MS = 700;

function buildOptimisticFeedback(input: FeedbackInput): FeedbackDTO {
  const timestamp = new Date().toISOString();
  return {
    id: `temp-${crypto.randomUUID()}`,
    name: input.name,
    email: input.email,
    message: input.message,
    allowFollowup: input.allowFollowup ?? true,
    sentiment: "neutral",
    priority: "Medium",
    category: "Other",
    assignedTeam: "Operations",
    analysisStatus: "FAILED",
    analysisError: "Analysis in progress...",
    notificationStatus: "SKIPPED",
    notificationError: "Pending...",
    notifiedAt: null,
    status: "New",
    assigneeName: null,
    pendingReason: null,
    resolutionSummary: null,
    resolvedAt: null,
    closedAt: null,
    lastActivityAt: timestamp,
    lastReminderAt: null,
    reminderCount: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function FeedbackModal({
  open,
  onOpenChange,
  onOptimisticCreate,
  onCreated,
  onFailed,
}: FeedbackModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);

  const form = useForm<FeedbackInput>({
    resolver: zodResolver(FeedbackInputSchema),
    defaultValues: {
      name: "",
      email: "",
      message: "",
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
    const optimistic = buildOptimisticFeedback(values);
    onOptimisticCreate?.(optimistic);

    const result = await createFeedbackAction(values);

    if (!result.ok) {
      onFailed?.(optimistic.id);
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
            form.setError(field as keyof FeedbackInput, { message: messages[0] });
          }
        });
      }
      setIsSubmitting(false);
      setStageIndex(0);
      return;
    }

    onCreated?.(optimistic.id, result.feedback);
    toast.success("Feedback submitted and routed.");
    form.reset();
    setIsSubmitting(false);
    setStageIndex(0);
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={isSubmitting ? undefined : onOpenChange}>
      <DialogContent className="max-w-xl border-border/60 bg-card/75 p-0 backdrop-blur-2xl">
        <div className="rounded-2xl border border-border/40 bg-card/50 p-6 sm:p-8">
          <DialogHeader className="mb-6 space-y-2 text-left">
            <DialogTitle className="font-mono text-lg tracking-[0.1em]">
              New Feedback Ticket
            </DialogTitle>
            <DialogDescription>
              Share a concise issue or feature request. EchoSort handles AI classification and
              team routing.
            </DialogDescription>
          </DialogHeader>

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
                        placeholder="Tell us what happened, what you expected, and how critical it is."
                        className="min-h-32 border-border/70 bg-background/70"
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center justify-between gap-3 pt-2">
                {isSubmitting ? (
                  <motion.div
                    key={stagedMessage}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1 text-xs text-muted-foreground"
                  >
                    <Sparkles className="size-3.5 text-primary" />
                    {stagedMessage}
                  </motion.div>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    AI tags sentiment, priority, category, and team.
                  </span>
                )}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-full px-5 font-medium shadow-[0_0_30px_rgba(109,239,210,0.25)]"
                >
                  {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Submit Ticket
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
