import { z } from "zod";

import { STATUS_OPTIONS } from "@/lib/constants";

export const TicketStatusSchema = z.enum(STATUS_OPTIONS);

export const UpdateTicketStatusSchema = z
  .object({
    ticketId: z.string().trim().min(1),
    status: TicketStatusSchema,
    actor: z.string().trim().min(2).max(60).default("Dashboard Operator"),
    pendingReason: z.string().trim().max(400).optional(),
    resolutionSummary: z.string().trim().max(1000).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.status === "Pending" && (!value.pendingReason || value.pendingReason.length < 5)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["pendingReason"],
        message: "Pending reason is required (minimum 5 characters).",
      });
    }
    if (
      value.status === "Resolved" &&
      (!value.resolutionSummary || value.resolutionSummary.length < 8)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["resolutionSummary"],
        message: "Resolution summary is required (minimum 8 characters).",
      });
    }
  });

export const AssignTicketSchema = z.object({
  ticketId: z.string().trim().min(1),
  assigneeName: z.string().trim().min(2).max(80),
  actor: z.string().trim().min(2).max(60).default("Dashboard Operator"),
});

export const AddTicketCommentSchema = z.object({
  ticketId: z.string().trim().min(1),
  authorName: z.string().trim().min(2).max(80).default("Dashboard Operator"),
  body: z.string().trim().min(2).max(2000),
});

export const DraftReminderSchema = z.object({
  ticketId: z.string().trim().min(1),
  actor: z.string().trim().min(2).max(60).default("Dashboard Operator"),
});

export const SendReminderSchema = z.object({
  ticketId: z.string().trim().min(1),
  actor: z.string().trim().min(2).max(60).default("Dashboard Operator"),
  recipient: z.email("Enter a valid recipient email.").max(150).optional(),
  subject: z.string().trim().min(6).max(180).optional(),
  body: z.string().trim().min(20).max(4000).optional(),
});

export type UpdateTicketStatusInput = z.infer<typeof UpdateTicketStatusSchema>;
export type AssignTicketInput = z.infer<typeof AssignTicketSchema>;
export type AddTicketCommentInput = z.infer<typeof AddTicketCommentSchema>;
export type DraftReminderInput = z.infer<typeof DraftReminderSchema>;
export type SendReminderInput = z.infer<typeof SendReminderSchema>;
