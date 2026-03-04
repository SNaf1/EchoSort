"use server";

import { revalidatePath } from "next/cache";

import { createFeedback } from "@/lib/feedback/feedback-service";
import type { FeedbackInput } from "@/lib/schemas/feedback";

export async function createFeedbackAction(input: FeedbackInput) {
  const result = await createFeedback(input);
  if (result.ok) {
    revalidatePath("/dashboard");
  }
  return result;
}
