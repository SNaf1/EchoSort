import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { z } from "zod";

import { getServerEnv } from "@/lib/env";

const ReminderDraftSchema = z.object({
  subject: z.string().min(8).max(140),
  body: z.string().min(40).max(2500),
  urgency: z.enum(["normal", "urgent"]),
  actionRequest: z.string().min(8).max(220),
});

export type ReminderDraft = z.infer<typeof ReminderDraftSchema>;

type DraftInput = {
  ticketId: string;
  category: string;
  priority: string;
  assignedTeam: string;
  status: string;
  assigneeName: string | null;
  summary: string;
};

function buildFallbackDraft(input: DraftInput): ReminderDraft {
  return {
    subject: `[EchoSort Reminder] ${input.category} ticket ${input.ticketId}`,
    body: [
      `Hello ${input.assignedTeam} team,`,
      "",
      `This is a reminder regarding ticket ${input.ticketId}.`,
      `Priority: ${input.priority}`,
      `Current status: ${input.status}`,
      "",
      "Ticket summary:",
      input.summary,
      "",
      "Please share an update and next action for this ticket.",
      "",
      "Thanks,",
      "EchoSort",
    ].join("\n"),
    urgency: input.priority === "Critical" || input.priority === "Urgent" ? "urgent" : "normal",
    actionRequest: "Provide ETA and current progress for this ticket.",
  };
}

export async function draftReminderWithAI(input: DraftInput): Promise<ReminderDraft> {
  const env = getServerEnv();
  if (!env.GOOGLE_API_KEY) return buildFallbackDraft(input);

  try {
    const model = new ChatGoogleGenerativeAI({
      model: env.GEMINI_MODEL,
      apiKey: env.GOOGLE_API_KEY,
      temperature: 0.2,
    });

    const structured = model.withStructuredOutput(ReminderDraftSchema, {
      name: "ticket_reminder_draft",
    });

    const prompt = [
      "ROLE: You are a professional SaaS ticket coordinator.",
      "TASK: Draft an internal reminder email for the assigned team.",
      "HARD CONSTRAINTS:",
      "- Use only the facts provided in INPUT.",
      "- Do not invent product behavior, incidents, customer details, or deadlines.",
      "- Keep tone concise, professional, action-oriented.",
      "- Ask for specific next step and ETA.",
      "- Return only schema fields.",
      "",
      "INPUT:",
      `ticketId: ${input.ticketId}`,
      `category: ${input.category}`,
      `priority: ${input.priority}`,
      `assignedTeam: ${input.assignedTeam}`,
      `status: ${input.status}`,
      `assigneeName: ${input.assigneeName ?? "Unassigned"}`,
      `summary: """${input.summary}"""`,
    ].join("\n");

    return await structured.invoke(prompt);
  } catch {
    return buildFallbackDraft(input);
  }
}
