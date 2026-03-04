"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Bot, MailWarning, PenSquare } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { ReminderComposeDrawer } from "@/components/tickets/reminder-compose-drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { STALE_TICKET_HOURS } from "@/lib/constants";
import { formatTicketCode } from "@/lib/ticket-id";
import type { FeedbackDTO } from "@/lib/types";

type AgenticReminderCardProps = {
  staleTickets: FeedbackDTO[];
};

export function AgenticReminderCard({ staleTickets }: AgenticReminderCardProps) {
  const router = useRouter();
  const [composeTicketId, setComposeTicketId] = useState<string | null>(null);

  return (
    <>
      <Card className="glass-panel border-border/60 bg-card/50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bot className="size-4 text-primary" />
              Agentic Follow-up
            </CardTitle>
            <Badge variant="outline" className="rounded-full">
              {staleTickets.length} stale
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {staleTickets.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No stale tickets. All active tickets have recent activity within {STALE_TICKET_HOURS}h.
            </p>
          ) : (
            <div className="space-y-2">
              {staleTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 bg-background/60 p-3"
                >
                  <div className="space-y-0.5">
                    <Link
                      href={`/dashboard/tickets/${ticket.id}`}
                      className="text-sm font-medium hover:underline"
                    >
                      Ticket {formatTicketCode(ticket.id)}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {ticket.assignedTeam} | {ticket.status} | last activity{" "}
                      {formatDistanceToNow(new Date(ticket.lastActivityAt), { addSuffix: true })}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setComposeTicketId(ticket.id)}>
                    <PenSquare className="mr-2 size-4" />
                    Compose Reminder
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <MailWarning className="size-3.5" />
            AI drafts reminder content first; you review and send.
          </div>
        </CardContent>
      </Card>

      <ReminderComposeDrawer
        open={composeTicketId !== null}
        ticketId={composeTicketId}
        onOpenChange={(open) => {
          if (!open) setComposeTicketId(null);
        }}
        onSent={() => router.refresh()}
      />
    </>
  );
}
