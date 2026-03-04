import type { Feedback, Prisma } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import { createFeedback } from "@/lib/feedback/feedback-service";

function buildRecord(data: Prisma.FeedbackUncheckedCreateInput): Feedback {
  const now = new Date();
  return {
    id: "507f1f77bcf86cd799439011",
    workspaceId: data.workspaceId ?? "test-workspace",
    name: data.name,
    email: data.email,
    message: data.message,
    allowFollowup: data.allowFollowup ?? true,
    sentiment: data.sentiment,
    priority: data.priority,
    category: data.category,
    assignedTeam: data.assignedTeam,
    analysisStatus: data.analysisStatus ?? "SUCCESS",
    analysisError: data.analysisError ?? null,
    notificationStatus: data.notificationStatus ?? "SKIPPED",
    notificationError: data.notificationError ?? null,
    notifiedAt: (data.notifiedAt as Date | null) ?? null,
    status: data.status ?? "New",
    assigneeName: data.assigneeName ?? null,
    pendingReason: data.pendingReason ?? null,
    resolutionSummary: data.resolutionSummary ?? null,
    resolvedAt: (data.resolvedAt as Date | null) ?? null,
    closedAt: (data.closedAt as Date | null) ?? null,
    lastActivityAt: (data.lastActivityAt as Date) ?? now,
    lastReminderAt: (data.lastReminderAt as Date | null) ?? null,
    reminderCount: data.reminderCount ?? 0,
    createdAt: now,
    updatedAt: now,
  };
}

describe("createFeedback service", () => {
  it("creates feedback, enriches fields, and sends notification when configured", async () => {
    const createInDb = vi.fn(async (data: Prisma.FeedbackUncheckedCreateInput) => buildRecord(data));
    const sendNotification = vi.fn(async () => {});

    const result = await createFeedback(
      {
        name: "Ava",
        email: "ava@example.com",
        message: "Billing page charged me twice for one invoice and this is urgent.",
      },
      {
        analyze: async () => ({
          analysis: {
            sentiment: "negative",
            priority: "Critical",
            category: "Billing",
            assignedTeam: "Finance",
          },
          analysisStatus: "SUCCESS",
          analysisError: null,
        }),
        readSettings: async () => ({
          settings: {
            engineeringEmail: "eng@example.com",
            productEmail: "product@example.com",
            financeEmail: "finance@example.com",
            operationsEmail: "ops@example.com",
          },
          isComplete: true,
          missingTeams: [],
        }),
        getWorkspaceId: async () => "test-workspace",
        isSmtpReady: () => true,
        sendNotification,
        createInDb,
      }
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.feedback.category).toBe("Billing");
    expect(result.feedback.notificationStatus).toBe("SENT");
    expect(sendNotification).toHaveBeenCalledTimes(1);
    expect(createInDb).toHaveBeenCalledTimes(1);
  });

  it("saves ticket with fallback metadata when analysis fails", async () => {
    const createInDb = vi.fn(async (data: Prisma.FeedbackUncheckedCreateInput) => buildRecord(data));
    const sendNotification = vi.fn(async () => {});

    const result = await createFeedback(
      {
        name: "Noah",
        email: "noah@example.com",
        message: "Import button is unresponsive after selecting a file for upload.",
      },
      {
        analyze: async () => ({
          analysis: {
            sentiment: "neutral",
            priority: "Medium",
            category: "Other",
            assignedTeam: "Operations",
          },
          analysisStatus: "FAILED",
          analysisError: "Gemini timeout",
        }),
        readSettings: async () => ({
          settings: null,
          isComplete: false,
          missingTeams: ["Engineering", "Product", "Finance", "Operations"],
        }),
        getWorkspaceId: async () => "test-workspace",
        isSmtpReady: () => false,
        sendNotification,
        createInDb,
      }
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.feedback.analysisStatus).toBe("FAILED");
    expect(result.feedback.notificationStatus).toBe("SKIPPED");
    expect(sendNotification).not.toHaveBeenCalled();
  });

  it("returns structured validation errors on invalid user input", async () => {
    const createInDb = vi.fn(async (data: Prisma.FeedbackUncheckedCreateInput) => buildRecord(data));

    const result = await createFeedback(
      {
        name: "A",
        email: "invalid",
        message: "short",
      },
      {
        analyze: async () => ({
          analysis: {
            sentiment: "neutral",
            priority: "Medium",
            category: "Other",
            assignedTeam: "Operations",
          },
          analysisStatus: "SUCCESS",
          analysisError: null,
        }),
        readSettings: async () => ({
          settings: null,
          isComplete: false,
          missingTeams: [],
        }),
        getWorkspaceId: async () => "test-workspace",
        isSmtpReady: () => false,
        sendNotification: async () => {},
        createInDb,
      }
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.fieldErrors?.name).toBeTruthy();
    expect(createInDb).not.toHaveBeenCalled();
  });
});
