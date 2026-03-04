import { z } from "zod";

import {
  CATEGORY_OPTIONS,
  PRIORITY_OPTIONS,
  SENTIMENT_OPTIONS,
  TEAM_OPTIONS,
} from "@/lib/constants";

export const FeedbackInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .max(80, "Name must be 80 characters or fewer."),
  email: z.email("Enter a valid email address.").max(150),
  message: z
    .string()
    .trim()
    .min(15, "Feedback must be at least 15 characters.")
    .max(2000, "Feedback must be 2000 characters or fewer."),
  allowFollowup: z.boolean().optional().default(true),
});

export const FeedbackAnalysisSchema = z.object({
  sentiment: z.enum(SENTIMENT_OPTIONS),
  priority: z.enum(PRIORITY_OPTIONS),
  category: z.enum(CATEGORY_OPTIONS),
  assignedTeam: z.enum(TEAM_OPTIONS),
});

export type FeedbackInput = z.input<typeof FeedbackInputSchema>;
export type FeedbackAnalysis = z.infer<typeof FeedbackAnalysisSchema>;
