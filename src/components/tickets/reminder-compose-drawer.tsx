"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2, MailCheck, Sparkles, X } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { draftReminderAction, sendReminderAction } from "@/app/actions/ticket-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type ReminderComposeDrawerProps = {
  open: boolean;
  ticketId: string | null;
  actor?: string;
  onOpenChange: (open: boolean) => void;
  onSent?: () => void;
};

export function ReminderComposeDrawer({
  open,
  ticketId,
  actor = "Dashboard Operator",
  onOpenChange,
  onSent,
}: ReminderComposeDrawerProps) {
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [loadedTicketId, setLoadedTicketId] = useState<string | null>(null);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [isSending, startTransition] = useTransition();
  const isDraftLoading = open && ticketId !== null && loadedTicketId !== ticketId;

  useEffect(() => {
    if (!open || !ticketId) return;
    let cancelled = false;

    void (async () => {
      setLoadedTicketId(null);
      setDraftError(null);
      const result = await draftReminderAction({
        ticketId,
        actor,
      });
      if (cancelled) return;
      if (!result.ok) {
        setDraftError(result.error);
        setLoadedTicketId(ticketId);
        return;
      }

      setRecipient(result.data.recipient);
      setSubject(result.data.subject);
      setBody(result.data.body);
      setLoadedTicketId(ticketId);
    })();
    return () => {
      cancelled = true;
    };
  }, [actor, open, ticketId]);

  const send = () => {
    if (!ticketId) return;
    if (recipient.trim().length < 5 || !recipient.includes("@")) {
      toast.error("Enter a valid recipient email.");
      return;
    }
    if (subject.trim().length < 6) {
      toast.error("Subject must be at least 6 characters.");
      return;
    }
    if (body.trim().length < 20) {
      toast.error("Email body must be at least 20 characters.");
      return;
    }

    startTransition(async () => {
      const result = await sendReminderAction({
        ticketId,
        actor,
        recipient: recipient.trim(),
        subject: subject.trim(),
        body: body.trim(),
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`Reminder sent to ${result.data.recipient}.`);
      onOpenChange(false);
      onSent?.();
    });
  };

  return (
    <AnimatePresence>
      {open && ticketId ? (
        <motion.section
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 18, scale: 0.98 }}
          transition={{ duration: 0.18 }}
          className="fixed right-4 bottom-4 z-50 w-[calc(100vw-2rem)] max-w-2xl rounded-2xl border border-border/70 bg-card/90 shadow-[0_14px_60px_rgba(6,8,7,0.45)] backdrop-blur-xl"
        >
          <header className="flex items-center justify-between border-b border-border/60 px-4 py-3">
            <div className="inline-flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <p className="text-sm font-medium">Reminder Draft Composer</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 rounded-full"
              onClick={() => onOpenChange(false)}
              aria-label="Close compose panel"
            >
              <X className="size-4" />
            </Button>
          </header>

          <div className="space-y-3 p-4">
            {isDraftLoading ? (
              <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Generating reminder draft...
              </div>
            ) : draftError ? (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {draftError}
              </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-[1.1fr_2fr]">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">To</label>
                <Input
                  value={recipient}
                  onChange={(event) => setRecipient(event.target.value)}
                  disabled={isDraftLoading || isSending}
                  className="border-border/70 bg-background/70"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Subject</label>
                <Input
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  disabled={isDraftLoading || isSending}
                  className="border-border/70 bg-background/70"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Body</label>
              <Textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                disabled={isDraftLoading || isSending}
                className="min-h-52 border-border/70 bg-background/70"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                disabled={isSending}
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="rounded-full px-5"
                disabled={isDraftLoading || isSending}
                onClick={send}
              >
                {isSending ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <MailCheck className="mr-2 size-4" />
                )}
                Send Email
              </Button>
            </div>
          </div>
        </motion.section>
      ) : null}
    </AnimatePresence>
  );
}
