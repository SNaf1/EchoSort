import type {
  Feedback,
  FeedbackActivity,
  FeedbackComment,
  FeedbackReminder,
} from "@prisma/client";

import type {
  FeedbackActivityDTO,
  FeedbackCommentDTO,
  FeedbackDTO,
  FeedbackReminderDTO,
} from "@/lib/types";

export function toFeedbackDTO(record: Feedback): FeedbackDTO {
  return {
    id: record.id,
    name: record.name,
    email: record.email,
    message: record.message,
    allowFollowup: record.allowFollowup,
    sentiment: record.sentiment,
    priority: record.priority,
    category: record.category,
    assignedTeam: record.assignedTeam,
    analysisStatus: record.analysisStatus,
    analysisError: record.analysisError,
    notificationStatus: record.notificationStatus,
    notificationError: record.notificationError,
    notifiedAt: record.notifiedAt ? record.notifiedAt.toISOString() : null,
    status: record.status,
    assigneeName: record.assigneeName,
    pendingReason: record.pendingReason,
    resolutionSummary: record.resolutionSummary,
    resolvedAt: record.resolvedAt ? record.resolvedAt.toISOString() : null,
    closedAt: record.closedAt ? record.closedAt.toISOString() : null,
    lastActivityAt: record.lastActivityAt.toISOString(),
    lastReminderAt: record.lastReminderAt ? record.lastReminderAt.toISOString() : null,
    reminderCount: record.reminderCount,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export function toFeedbackCommentDTO(record: FeedbackComment): FeedbackCommentDTO {
  return {
    id: record.id,
    feedbackId: record.feedbackId,
    authorName: record.authorName,
    body: record.body,
    createdAt: record.createdAt.toISOString(),
  };
}

export function toFeedbackActivityDTO(record: FeedbackActivity): FeedbackActivityDTO {
  return {
    id: record.id,
    feedbackId: record.feedbackId,
    eventType: record.eventType,
    actor: record.actor,
    metadata: record.metadata,
    createdAt: record.createdAt.toISOString(),
  };
}

export function toFeedbackReminderDTO(record: FeedbackReminder): FeedbackReminderDTO {
  return {
    id: record.id,
    feedbackId: record.feedbackId,
    draftSubject: record.draftSubject,
    draftBody: record.draftBody,
    recipient: record.recipient,
    status: record.status,
    error: record.error,
    sentAt: record.sentAt ? record.sentAt.toISOString() : null,
    createdAt: record.createdAt.toISOString(),
  };
}
