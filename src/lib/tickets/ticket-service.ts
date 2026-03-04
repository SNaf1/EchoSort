import { subHours } from "date-fns";
import type { ActivityType, Feedback, Prisma, TicketStatus } from "@prisma/client";

import { draftReminderWithAI } from "@/lib/ai/reminder-drafter";
import { STALE_TICKET_HOURS } from "@/lib/constants";
import { sendReminderEmail } from "@/lib/email/smtp";
import {
  toFeedbackActivityDTO,
  toFeedbackCommentDTO,
  toFeedbackDTO,
  toFeedbackReminderDTO,
} from "@/lib/feedback-mappers";
import { prisma } from "@/lib/prisma";
import {
  AddTicketCommentSchema,
  AssignTicketSchema,
  DraftReminderSchema,
  SendReminderSchema,
  UpdateTicketStatusSchema,
  type AddTicketCommentInput,
  type AssignTicketInput,
  type DraftReminderInput,
  type SendReminderInput,
  type UpdateTicketStatusInput,
} from "@/lib/schemas/tickets";
import {
  getNotificationSettingsState,
  resolveTeamRecipient,
} from "@/lib/settings/notification-settings";
import { getWorkspaceIdOrThrow } from "@/lib/workspace/workspace";
import type { FeedbackDTO, TicketDetailsDTO } from "@/lib/types";

const ALLOWED_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  New: ["InProgress", "Pending", "Resolved"],
  InProgress: ["Pending", "Resolved"],
  Pending: ["InProgress", "Resolved"],
  Resolved: ["InProgress", "Closed"],
  Closed: [],
};

type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };

function parseJsonError(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

type ReminderDraftBundle =
  | {
      ok: true;
      ticket: Feedback;
      recipient: string;
      subject: string;
      body: string;
      urgency: "normal" | "urgent";
      actionRequest: string;
    }
  | { ok: false; error: string };

type ReminderContextBundle =
  | {
      ok: true;
      ticket: Feedback;
      recipient: string;
    }
  | { ok: false; error: string };

async function buildReminderContextBundle(ticketId: string): Promise<ReminderContextBundle> {
  const workspaceId = await getWorkspaceIdOrThrow();
  const ticket = await prisma.feedback.findFirst({
    where: {
      id: ticketId,
      workspaceId,
    },
  });
  if (!ticket) return { ok: false, error: "Ticket not found." };

  const settingsState = await getNotificationSettingsState();
  const recipient = resolveTeamRecipient(ticket.assignedTeam, settingsState.settings);
  if (!recipient) {
    return {
      ok: false,
      error: `No recipient configured for ${ticket.assignedTeam}. Update dashboard settings first.`,
    };
  }

  return { ok: true, ticket, recipient };
}

async function buildReminderDraftBundle(ticketId: string): Promise<ReminderDraftBundle> {
  const context = await buildReminderContextBundle(ticketId);
  if (!context.ok) return context;
  const { ticket, recipient } = context;

  const draft = await draftReminderWithAI({
    ticketId: ticket.id,
    category: ticket.category,
    priority: ticket.priority,
    assignedTeam: ticket.assignedTeam,
    status: ticket.status,
    assigneeName: ticket.assigneeName,
    summary: ticket.message,
  });

  return {
    ok: true,
    ticket,
    recipient,
    subject: draft.subject,
    body: draft.body,
    urgency: draft.urgency,
    actionRequest: draft.actionRequest,
  };
}

export async function getTicketDetails(ticketId: string): Promise<TicketDetailsDTO | null> {
  const workspaceId = await getWorkspaceIdOrThrow();
  const feedback = await prisma.feedback.findFirst({
    where: {
      id: ticketId,
      workspaceId,
    },
  });
  if (!feedback) return null;

  const [comments, activities, reminders] = await Promise.all([
    prisma.feedbackComment.findMany({
      where: { feedbackId: ticketId },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.feedbackActivity.findMany({
      where: { feedbackId: ticketId },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.feedbackReminder.findMany({
      where: { feedbackId: ticketId },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  return {
    feedback: toFeedbackDTO(feedback),
    comments: comments.map(toFeedbackCommentDTO),
    activities: activities.map(toFeedbackActivityDTO),
    reminders: reminders.map(toFeedbackReminderDTO),
  };
}

export async function getStaleTickets(limit = 5): Promise<FeedbackDTO[]> {
  const workspaceId = await getWorkspaceIdOrThrow();
  const threshold = subHours(new Date(), STALE_TICKET_HOURS);
  const records = await prisma.feedback.findMany({
    where: {
      workspaceId,
      status: {
        in: ["New", "InProgress", "Pending", "Resolved"],
      },
      lastActivityAt: {
        lt: threshold,
      },
    },
    orderBy: { lastActivityAt: "asc" },
    take: limit,
  });
  return records.map(toFeedbackDTO);
}

async function logTicketActivity(params: {
  feedbackId: string;
  eventType: ActivityType;
  actor: string;
  metadata?: Prisma.InputJsonValue;
}) {
  await prisma.feedbackActivity.create({
    data: {
      feedbackId: params.feedbackId,
      eventType: params.eventType,
      actor: params.actor,
      metadata: params.metadata ?? null,
    },
  });
}

export async function updateTicketStatus(
  input: UpdateTicketStatusInput
): Promise<ServiceResult<FeedbackDTO>> {
  const parsed = UpdateTicketStatusSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid status payload.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  const payload = parsed.data;

  const workspaceId = await getWorkspaceIdOrThrow();
  const existing = await prisma.feedback.findFirst({
    where: {
      id: payload.ticketId,
      workspaceId,
    },
  });
  if (!existing) return { ok: false, error: "Ticket not found." };

  if (existing.status === payload.status) {
    return { ok: true, data: toFeedbackDTO(existing) };
  }

  if (!ALLOWED_TRANSITIONS[existing.status].includes(payload.status)) {
    return {
      ok: false,
      error: `Invalid transition from ${existing.status} to ${payload.status}.`,
    };
  }

  const now = new Date();
  const updateData: Prisma.FeedbackUpdateInput = {
    status: payload.status,
    lastActivityAt: now,
    closedAt: payload.status === "Closed" ? now : null,
    pendingReason: payload.status === "Pending" ? payload.pendingReason : null,
    resolutionSummary:
      payload.status === "Resolved"
        ? payload.resolutionSummary
        : payload.status === "Closed"
          ? existing.resolutionSummary
          : existing.resolutionSummary,
    resolvedAt:
      payload.status === "Resolved" ? now : payload.status === "Closed" ? existing.resolvedAt : null,
  };

  const updated = await prisma.feedback.update({
    where: { id: payload.ticketId },
    data: updateData,
  });

  await logTicketActivity({
    feedbackId: payload.ticketId,
    eventType: "StatusChanged",
    actor: payload.actor,
    metadata: {
      from: existing.status,
      to: payload.status,
      pendingReason: payload.pendingReason ?? null,
      resolutionSummary: payload.resolutionSummary ?? null,
    },
  });

  return { ok: true, data: toFeedbackDTO(updated) };
}

export async function assignTicket(input: AssignTicketInput): Promise<ServiceResult<FeedbackDTO>> {
  const parsed = AssignTicketSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid assignment payload.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  const payload = parsed.data;

  const workspaceId = await getWorkspaceIdOrThrow();
  const existing = await prisma.feedback.findFirst({
    where: {
      id: payload.ticketId,
      workspaceId,
    },
  });
  if (!existing) return { ok: false, error: "Ticket not found." };

  const updated = await prisma.feedback.update({
    where: { id: payload.ticketId },
    data: {
      assigneeName: payload.assigneeName,
      lastActivityAt: new Date(),
    },
  });

  await logTicketActivity({
    feedbackId: payload.ticketId,
    eventType: "Assigned",
    actor: payload.actor,
    metadata: {
      from: existing.assigneeName,
      to: payload.assigneeName,
    },
  });

  return { ok: true, data: toFeedbackDTO(updated) };
}

export async function addTicketComment(
  input: AddTicketCommentInput
): Promise<ServiceResult<TicketDetailsDTO>> {
  const parsed = AddTicketCommentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid comment payload.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  const payload = parsed.data;
  const workspaceId = await getWorkspaceIdOrThrow();
  const existing = await prisma.feedback.findFirst({
    where: {
      id: payload.ticketId,
      workspaceId,
    },
  });
  if (!existing) return { ok: false, error: "Ticket not found." };

  await prisma.$transaction([
    prisma.feedbackComment.create({
      data: {
        feedbackId: payload.ticketId,
        authorName: payload.authorName,
        body: payload.body,
      },
    }),
    prisma.feedback.update({
      where: { id: payload.ticketId },
      data: { lastActivityAt: new Date() },
    }),
    prisma.feedbackActivity.create({
      data: {
        feedbackId: payload.ticketId,
        eventType: "CommentAdded",
        actor: payload.authorName,
        metadata: { bodyPreview: payload.body.slice(0, 120) },
      },
    }),
  ]);

  const details = await getTicketDetails(payload.ticketId);
  if (!details) return { ok: false, error: "Ticket no longer exists." };

  return { ok: true, data: details };
}

export async function getReminderDraftForTicket(
  input: DraftReminderInput
): Promise<
  ServiceResult<{
    ticketId: string;
    recipient: string;
    subject: string;
    body: string;
    urgency: "normal" | "urgent";
    actionRequest: string;
  }>
> {
  const parsed = DraftReminderSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid draft payload.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  const payload = parsed.data;

  const bundle = await buildReminderDraftBundle(payload.ticketId);
  if (!bundle.ok) return { ok: false, error: bundle.error };

  await prisma.$transaction([
    prisma.feedback.update({
      where: { id: bundle.ticket.id },
      data: { lastActivityAt: new Date() },
    }),
    prisma.feedbackActivity.create({
      data: {
        feedbackId: bundle.ticket.id,
        eventType: "ReminderDrafted",
        actor: payload.actor,
        metadata: {
          recipient: bundle.recipient,
          subject: bundle.subject,
          urgency: bundle.urgency,
        },
      },
    }),
  ]);

  return {
    ok: true,
    data: {
      ticketId: bundle.ticket.id,
      recipient: bundle.recipient,
      subject: bundle.subject,
      body: bundle.body,
      urgency: bundle.urgency,
      actionRequest: bundle.actionRequest,
    },
  };
}

export async function sendReminderForTicket(
  input: SendReminderInput
): Promise<ServiceResult<{ reminderId: string; subject: string; recipient: string }>> {
  const parsed = SendReminderSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid reminder payload.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  const payload = parsed.data;
  const context = await buildReminderContextBundle(payload.ticketId);
  if (!context.ok) return { ok: false, error: context.error };

  const recipient = payload.recipient ?? context.recipient;

  const hasManualCompose = Boolean(payload.subject && payload.body);
  let subject = payload.subject ?? "";
  let body = payload.body ?? "";
  let urgency: "normal" | "urgent" = "normal";
  let actionRequest = "Provide ETA and current progress for this ticket.";

  if (hasManualCompose) {
    urgency =
      context.ticket.priority === "Critical" || context.ticket.priority === "Urgent"
        ? "urgent"
        : "normal";
  } else {
    const draftBundle = await buildReminderDraftBundle(payload.ticketId);
    if (!draftBundle.ok) return { ok: false, error: draftBundle.error };
    subject = draftBundle.subject;
    body = draftBundle.body;
    urgency = draftBundle.urgency;
    actionRequest = draftBundle.actionRequest;
  }

  try {
    await sendReminderEmail({
      recipient,
      subject,
      body,
    });

    const now = new Date();
    const [reminder] = await prisma.$transaction([
      prisma.feedbackReminder.create({
        data: {
          feedbackId: context.ticket.id,
          draftSubject: subject,
          draftBody: body,
          recipient,
          status: "SENT",
          sentAt: now,
        },
      }),
      prisma.feedback.update({
        where: { id: context.ticket.id },
        data: {
          reminderCount: { increment: 1 },
          lastReminderAt: now,
          lastActivityAt: now,
        },
      }),
      prisma.feedbackActivity.create({
        data: {
          feedbackId: context.ticket.id,
          eventType: "ReminderSent",
          actor: payload.actor,
          metadata: {
            recipient,
            subject,
            urgency,
            actionRequest,
            composeMode: hasManualCompose ? "manual" : "auto",
          },
        },
      }),
    ]);

    return {
      ok: true,
      data: {
        reminderId: reminder.id,
        subject: reminder.draftSubject,
        recipient: reminder.recipient,
      },
    };
  } catch (error) {
    const message = parseJsonError(error, "Failed to send reminder email.");
    const now = new Date();
    await prisma.feedbackReminder.create({
      data: {
        feedbackId: context.ticket.id,
        draftSubject: subject,
        draftBody: body,
        recipient,
        status: "FAILED",
        error: message,
      },
    });
    await prisma.feedbackActivity.create({
      data: {
        feedbackId: context.ticket.id,
        eventType: "ReminderFailed",
        actor: payload.actor,
        metadata: {
          recipient,
          error: message,
        },
      },
    });
    await prisma.feedback.update({
      where: { id: context.ticket.id },
      data: { lastActivityAt: now },
    });
    return { ok: false, error: message };
  }
}
