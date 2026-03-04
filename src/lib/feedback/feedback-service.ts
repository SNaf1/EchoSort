import type { Feedback, NotificationStatus, Prisma } from "@prisma/client";

import { toFeedbackDTO } from "@/lib/feedback-mappers";
import {
  FeedbackInputSchema,
  type FeedbackAnalysis,
  type FeedbackInput,
} from "@/lib/schemas/feedback";
import type { FeedbackDTO } from "@/lib/types";

export type CreateFeedbackResult =
  | {
      ok: true;
      feedback: FeedbackDTO;
    }
  | {
      ok: false;
      error: string;
      fieldErrors?: Record<string, string[] | undefined>;
    };

type CreateFeedbackDependencies = {
  analyze: (message: string) => Promise<FeedbackAnalysisResult>;
  readSettings: () => Promise<NotificationSettingsState>;
  getWorkspaceId: () => Promise<string>;
  isSmtpReady: () => boolean;
  sendNotification: (payload: {
    recipient: string;
    team: "Engineering" | "Product" | "Finance" | "Operations";
    feedbackName: string;
    feedbackEmail: string;
    message: string;
    category: string;
    sentiment: string;
    priority: "Low" | "Medium" | "High" | "Urgent" | "Critical";
  }) => Promise<void>;
  createInDb: (data: Prisma.FeedbackUncheckedCreateInput) => Promise<Feedback>;
  logCreatedActivity?: (feedbackId: string) => Promise<void>;
};

type NotificationSettingsState = {
  settings: {
    engineeringEmail: string | null;
    productEmail: string | null;
    financeEmail: string | null;
    operationsEmail: string | null;
  } | null;
  isComplete: boolean;
  missingTeams: string[];
};

type FeedbackAnalysisResult = {
  analysis: FeedbackAnalysis;
  analysisStatus: "SUCCESS" | "FAILED";
  analysisError: string | null;
};

function resolveTeamRecipient(
  team: "Engineering" | "Product" | "Finance" | "Operations",
  settings: NotificationSettingsState["settings"]
) {
  if (!settings) return null;
  if (team === "Engineering") return settings.engineeringEmail;
  if (team === "Product") return settings.productEmail;
  if (team === "Finance") return settings.financeEmail;
  return settings.operationsEmail;
}

async function getDefaultDependencies(): Promise<CreateFeedbackDependencies> {
  const [
    { analyzeFeedbackWithAI },
    { canUseSmtp, sendTeamNotification },
    { prisma },
    settings,
    workspace,
  ] = await Promise.all([
    import("@/lib/ai/feedback-analyzer"),
    import("@/lib/email/smtp"),
    import("@/lib/prisma"),
    import("@/lib/settings/notification-settings"),
    import("@/lib/workspace/workspace"),
  ]);

  return {
    analyze: analyzeFeedbackWithAI,
    readSettings: settings.getNotificationSettingsState,
    getWorkspaceId: workspace.getWorkspaceIdOrThrow,
    isSmtpReady: canUseSmtp,
    sendNotification: sendTeamNotification,
    createInDb: (data) => prisma.feedback.create({ data }),
    logCreatedActivity: async (feedbackId) => {
      await prisma.feedbackActivity.create({
        data: {
          feedbackId,
          eventType: "TicketCreated",
          actor: "EchoSort AI Intake",
          metadata: null,
        },
      });
    },
  };
}

export async function createFeedback(
  input: FeedbackInput,
  dependencies?: CreateFeedbackDependencies
): Promise<CreateFeedbackResult> {
  const parsed = FeedbackInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please correct the form fields and try again.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const activeDependencies = dependencies ?? (await getDefaultDependencies());

  const [analysisResult, settingsState, workspaceId] = await Promise.all([
    activeDependencies.analyze(parsed.data.message),
    activeDependencies.readSettings(),
    activeDependencies.getWorkspaceId(),
  ]);

  let notificationStatus: NotificationStatus = "SKIPPED";
  let notificationError: string | null = null;
  let notifiedAt: Date | null = null;

  const recipient = resolveTeamRecipient(
    analysisResult.analysis.assignedTeam,
    settingsState.settings
  );

  if (!recipient) {
    notificationStatus = "SKIPPED";
    notificationError = "Recipient email is not configured for the assigned team.";
  } else if (!activeDependencies.isSmtpReady()) {
    notificationStatus = "SKIPPED";
    notificationError = "SMTP is not configured.";
  } else {
    try {
      await activeDependencies.sendNotification({
        recipient,
        team: analysisResult.analysis.assignedTeam,
        feedbackName: parsed.data.name,
        feedbackEmail: parsed.data.email,
        message: parsed.data.message,
        category: analysisResult.analysis.category,
        sentiment: analysisResult.analysis.sentiment,
        priority: analysisResult.analysis.priority,
      });
      notificationStatus = "SENT";
      notificationError = null;
      notifiedAt = new Date();
    } catch (error) {
      notificationStatus = "FAILED";
      notificationError = error instanceof Error ? error.message : "Unknown email error.";
    }
  }

  const created = await activeDependencies.createInDb({
    workspaceId,
    name: parsed.data.name,
    email: parsed.data.email,
    message: parsed.data.message,
    allowFollowup: parsed.data.allowFollowup,
    sentiment: analysisResult.analysis.sentiment,
    priority: analysisResult.analysis.priority,
    category: analysisResult.analysis.category,
    assignedTeam: analysisResult.analysis.assignedTeam,
    analysisStatus: analysisResult.analysisStatus,
    analysisError: analysisResult.analysisError,
    notificationStatus,
    notificationError,
    notifiedAt,
  });

  if (activeDependencies.logCreatedActivity) {
    await activeDependencies.logCreatedActivity(created.id);
  }

  return { ok: true, feedback: toFeedbackDTO(created) };
}
