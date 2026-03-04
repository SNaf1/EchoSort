import { describe, expect, it } from "vitest";

import { UpdateTicketStatusSchema } from "@/lib/schemas/tickets";

describe("UpdateTicketStatusSchema", () => {
  it("requires pending reason when moving to Pending", () => {
    const parsed = UpdateTicketStatusSchema.safeParse({
      ticketId: "abc",
      status: "Pending",
      actor: "Operator",
    });
    expect(parsed.success).toBe(false);
  });

  it("requires resolution summary when moving to Resolved", () => {
    const parsed = UpdateTicketStatusSchema.safeParse({
      ticketId: "abc",
      status: "Resolved",
      actor: "Operator",
      resolutionSummary: "done",
    });
    expect(parsed.success).toBe(false);
  });

  it("accepts valid resolved payload", () => {
    const parsed = UpdateTicketStatusSchema.safeParse({
      ticketId: "abc",
      status: "Resolved",
      actor: "Operator",
      resolutionSummary: "Issue fixed and patch deployed.",
    });
    expect(parsed.success).toBe(true);
  });
});
