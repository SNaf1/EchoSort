import type {
  AnalysisStatus,
  ActivityType,
  FeedbackCategory,
  NotificationStatus,
  Priority,
  ReminderStatus,
  Sentiment,
  Team,
  TicketStatus,
} from "@prisma/client";

export type FeedbackDTO = {
  id: string;
  name: string;
  email: string;
  message: string;
  allowFollowup: boolean;
  sentiment: Sentiment;
  priority: Priority;
  category: FeedbackCategory;
  assignedTeam: Team;
  analysisStatus: AnalysisStatus;
  analysisError: string | null;
  notificationStatus: NotificationStatus;
  notificationError: string | null;
  notifiedAt: string | null;
  status: TicketStatus;
  assigneeName: string | null;
  pendingReason: string | null;
  resolutionSummary: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  lastActivityAt: string;
  lastReminderAt: string | null;
  reminderCount: number;
  createdAt: string;
  updatedAt: string;
};

export type DashboardMetrics = {
  total: number;
  highPriority: number;
  negativeCount: number;
  topCategory: FeedbackCategory | "None";
  topTeam: Team | "None";
};

export type TrendPoint = {
  x: string;
  opened: number;
  resolved: number;
  highPriority: number;
  negative: number;
};

export type FeedbackCommentDTO = {
  id: string;
  feedbackId: string;
  authorName: string;
  body: string;
  createdAt: string;
};

export type FeedbackActivityDTO = {
  id: string;
  feedbackId: string;
  eventType: ActivityType;
  actor: string;
  metadata: unknown;
  createdAt: string;
};

export type FeedbackReminderDTO = {
  id: string;
  feedbackId: string;
  draftSubject: string;
  draftBody: string;
  recipient: string;
  status: ReminderStatus;
  error: string | null;
  sentAt: string | null;
  createdAt: string;
};

export type TicketDetailsDTO = {
  feedback: FeedbackDTO;
  comments: FeedbackCommentDTO[];
  activities: FeedbackActivityDTO[];
  reminders: FeedbackReminderDTO[];
};
