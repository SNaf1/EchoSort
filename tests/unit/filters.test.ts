import { describe, expect, it } from "vitest";

import { applyFeedbackFilters } from "@/lib/filters";
import type { FeedbackDTO } from "@/lib/types";

const sampleFeedback: FeedbackDTO[] = [
  {
    id: "1",
    name: "Mia Patel",
    email: "mia@example.com",
    message: "Crash in CSV importer with 2k rows.",
    allowFollowup: true,
    sentiment: "negative",
    priority: "Critical",
    category: "Bug",
    assignedTeam: "Engineering",
    analysisStatus: "SUCCESS",
    analysisError: null,
    notificationStatus: "SENT",
    notificationError: null,
    notifiedAt: new Date().toISOString(),
    status: "InProgress",
    assigneeName: "Alex",
    pendingReason: null,
    resolutionSummary: null,
    resolvedAt: null,
    closedAt: null,
    lastActivityAt: new Date().toISOString(),
    lastReminderAt: null,
    reminderCount: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Liam Chen",
    email: "liam@example.com",
    message: "Please add quick filters for dashboard presets.",
    allowFollowup: true,
    sentiment: "neutral",
    priority: "Medium",
    category: "Feature",
    assignedTeam: "Product",
    analysisStatus: "SUCCESS",
    analysisError: null,
    notificationStatus: "SKIPPED",
    notificationError: null,
    notifiedAt: null,
    status: "New",
    assigneeName: null,
    pendingReason: null,
    resolutionSummary: null,
    resolvedAt: null,
    closedAt: null,
    lastActivityAt: new Date().toISOString(),
    lastReminderAt: null,
    reminderCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

describe("applyFeedbackFilters", () => {
  it("supports fuzzy query across name/email/message", () => {
    const filtered = applyFeedbackFilters(sampleFeedback, {
      query: "csv imp",
      categories: [],
      priorities: [],
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.id).toBe("1");
  });

  it("supports searching by ticket display id", () => {
    const filtered = applyFeedbackFilters(sampleFeedback, {
      query: "00000002",
      categories: [],
      priorities: [],
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.id).toBe("2");
  });

  it("applies category and priority intersections", () => {
    const filtered = applyFeedbackFilters(sampleFeedback, {
      query: "",
      categories: ["Bug"],
      priorities: ["Critical"],
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.assignedTeam).toBe("Engineering");
  });
});
