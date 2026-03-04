import { describe, expect, it } from "vitest";

import {
  FeedbackAnalysisSchema,
  FeedbackInputSchema,
} from "@/lib/schemas/feedback";

describe("Feedback schemas", () => {
  it("accepts a valid feedback input payload", () => {
    const parsed = FeedbackInputSchema.safeParse({
      name: "Ava Jones",
      email: "ava@example.com",
      message: "The billing retry flow charged me twice during checkout confirmation.",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects too-short feedback input", () => {
    const parsed = FeedbackInputSchema.safeParse({
      name: "A",
      email: "not-an-email",
      message: "Too short",
    });
    expect(parsed.success).toBe(false);
  });

  it("enforces enum boundaries for AI analysis output", () => {
    const parsed = FeedbackAnalysisSchema.safeParse({
      sentiment: "positive",
      priority: "Critical",
      category: "Bug",
      assignedTeam: "Engineering",
    });
    expect(parsed.success).toBe(true);

    const invalid = FeedbackAnalysisSchema.safeParse({
      sentiment: "mixed",
      priority: "P9",
      category: "Bug",
      assignedTeam: "Engineering",
    });
    expect(invalid.success).toBe(false);
  });
});
