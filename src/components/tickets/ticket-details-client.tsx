"use client";

import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowLeft,
  Clock3,
  Loader2,
  MessageSquareText,
  PenSquare,
  RefreshCcw,
  UserRoundCog,
} from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  addTicketCommentAction,
  assignTicketAction,
  updateTicketStatusAction,
} from "@/app/actions/ticket-actions";
import {
  CategoryBadge,
  PriorityBadge,
  SentimentBadge,
  StatusBadge,
  TeamBadge,
} from "@/components/dashboard/feedback-badges";
import { ReminderComposeDrawer } from "@/components/tickets/reminder-compose-drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { STATUS_OPTIONS } from "@/lib/constants";
import { formatTicketCode } from "@/lib/ticket-id";
import type { TicketDetailsDTO } from "@/lib/types";
import { useRouter } from "next/navigation";

type TicketDetailsClientProps = {
  initialData: TicketDetailsDTO;
};

function formatStatus(status: string) {
  return status === "InProgress" ? "In Progress" : status;
}

export function TicketDetailsClient({ initialData }: TicketDetailsClientProps) {
  const router = useRouter();
  const [status, setStatus] = useState(initialData.feedback.status);
  const [pendingReason, setPendingReason] = useState(initialData.feedback.pendingReason ?? "");
  const [resolutionSummary, setResolutionSummary] = useState(
    initialData.feedback.resolutionSummary ?? ""
  );
  const [assigneeName, setAssigneeName] = useState(initialData.feedback.assigneeName ?? "");
  const [commentBody, setCommentBody] = useState("");
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const sortedActivities = useMemo(
    () => [...initialData.activities].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [initialData.activities]
  );

  const applyStatus = () => {
    startTransition(async () => {
      const result = await updateTicketStatusAction({
        ticketId: initialData.feedback.id,
        status,
        actor: "Dashboard Operator",
        pendingReason: pendingReason || undefined,
        resolutionSummary: resolutionSummary || undefined,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`Status updated to ${formatStatus(status)}.`);
      router.refresh();
    });
  };

  const applyAssignee = () => {
    if (assigneeName.trim().length < 2) {
      toast.error("Assignee name must be at least 2 characters.");
      return;
    }
    startTransition(async () => {
      const result = await assignTicketAction({
        ticketId: initialData.feedback.id,
        assigneeName: assigneeName.trim(),
        actor: "Dashboard Operator",
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Ticket assignee updated.");
      router.refresh();
    });
  };

  const addComment = () => {
    if (commentBody.trim().length < 2) {
      toast.error("Comment must be at least 2 characters.");
      return;
    }
    startTransition(async () => {
      const result = await addTicketCommentAction({
        ticketId: initialData.feedback.id,
        authorName: "Dashboard Operator",
        body: commentBody.trim(),
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setCommentBody("");
      toast.success("Comment added.");
      router.refresh();
    });
  };

  return (
    <div className="mx-auto w-full max-w-[96rem] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-4 flex items-center justify-between gap-2">
        <Button asChild variant="outline" className="rounded-full">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 size-4" />
            Back to Dashboard
          </Link>
        </Button>
        <Button variant="ghost" onClick={() => router.refresh()} className="rounded-full">
          <RefreshCcw className="mr-2 size-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="glass-panel border-border/60 bg-card/55 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-xl">
              Ticket {formatTicketCode(initialData.feedback.id)}
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge value={initialData.feedback.status} />
              <PriorityBadge value={initialData.feedback.priority} />
              <CategoryBadge value={initialData.feedback.category} />
              <TeamBadge value={initialData.feedback.assignedTeam} />
              <SentimentBadge value={initialData.feedback.sentiment} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-border/70 bg-background/70 p-4">
              <p className="text-sm leading-7">{initialData.feedback.message}</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-lg border border-border/60 p-3 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">Reporter</p>
                <p>{initialData.feedback.name}</p>
                <p>{initialData.feedback.email}</p>
                <p>
                  Follow-up:{" "}
                  <span className="font-medium text-foreground">
                    {initialData.feedback.allowFollowup ? "Allowed" : "Not allowed"}
                  </span>
                </p>
              </div>
              <div className="rounded-lg border border-border/60 p-3 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">Timeline</p>
                <p>Created: {format(new Date(initialData.feedback.createdAt), "PPP p")}</p>
                <p>
                  Last activity: {format(new Date(initialData.feedback.lastActivityAt), "PPP p")}
                </p>
                <p>Reminders sent: {initialData.feedback.reminderCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel border-border/60 bg-card/55">
          <CardHeader>
            <CardTitle className="text-base">Ticket Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Status</p>
              <Select value={status} onValueChange={(value) => setStatus(value as (typeof STATUS_OPTIONS)[number])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((item) => (
                    <SelectItem key={item} value={item}>
                      {formatStatus(item)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {status === "Pending" && (
                <Input
                  value={pendingReason}
                  onChange={(event) => setPendingReason(event.target.value)}
                  placeholder="Pending reason"
                />
              )}
              {status === "Resolved" && (
                <Textarea
                  value={resolutionSummary}
                  onChange={(event) => setResolutionSummary(event.target.value)}
                  placeholder="Resolution summary"
                  className="min-h-20"
                />
              )}
              <Button onClick={applyStatus} disabled={isPending} className="w-full">
                {isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Clock3 className="mr-2 size-4" />}
                Update Status
              </Button>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Assignee</p>
              <Input
                value={assigneeName}
                onChange={(event) => setAssigneeName(event.target.value)}
                placeholder="Assign to teammate"
              />
              <Button onClick={applyAssignee} disabled={isPending} variant="secondary" className="w-full">
                <UserRoundCog className="mr-2 size-4" />
                Save Assignee
              </Button>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Agentic Reminder</p>
              <Button onClick={() => setIsComposeOpen(true)} variant="outline" className="w-full">
                <PenSquare className="mr-2 size-4" />
                Compose Reminder
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="glass-panel border-border/60 bg-card/55 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Comments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={commentBody}
              onChange={(event) => setCommentBody(event.target.value)}
              placeholder="Add internal note..."
              className="min-h-24"
            />
            <Button onClick={addComment} disabled={isPending}>
              <MessageSquareText className="mr-2 size-4" />
              Add Comment
            </Button>
            <div className="space-y-2">
              {initialData.comments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No comments yet.</p>
              ) : (
                initialData.comments.map((comment) => (
                  <div key={comment.id} className="rounded-lg border border-border/60 p-3">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{comment.authorName}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(comment.createdAt), "PPP p")}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">{comment.body}</p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="glass-panel border-border/60 bg-card/55">
            <CardHeader>
              <CardTitle className="text-base">Reminder History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {initialData.reminders.length === 0 ? (
                <p className="text-sm text-muted-foreground">No reminders sent yet.</p>
              ) : (
                initialData.reminders.map((item) => (
                  <div key={item.id} className="rounded-lg border border-border/60 p-3">
                    <p className="line-clamp-2 text-sm font-medium">{item.draftSubject}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{item.recipient}</p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <Badge variant="outline">{item.status}</Badge>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(item.createdAt), "MM/dd p")}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="glass-panel border-border/60 bg-card/55">
            <CardHeader>
              <CardTitle className="text-base">Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {sortedActivities.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity yet.</p>
              ) : (
                sortedActivities.map((item) => (
                  <div key={item.id} className="rounded-lg border border-border/60 p-3">
                    <p className="text-sm font-medium">{item.eventType}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.actor} | {format(new Date(item.createdAt), "MM/dd p")}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ReminderComposeDrawer
        open={isComposeOpen}
        ticketId={initialData.feedback.id}
        onOpenChange={setIsComposeOpen}
        onSent={() => router.refresh()}
      />
    </div>
  );
}
