"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import {
  createFeedback,
  type CreateFeedbackResult,
} from "@/lib/feedback/feedback-service";
import { extractClientIpFromHeaders } from "@/lib/rate-limit/client-ip";
import { checkSubmissionRateLimit } from "@/lib/rate-limit/submission-limiter";
import type { FeedbackInput } from "@/lib/schemas/feedback";

export type CreateFeedbackActionResult =
  | CreateFeedbackResult
  | {
      ok: false;
      error: string;
      code: "RATE_LIMITED";
      retryAfterSeconds: number;
    };

export async function createFeedbackAction(
  input: FeedbackInput
): Promise<CreateFeedbackActionResult> {
  const requestHeaders = await headers();
  const clientIp = extractClientIpFromHeaders(requestHeaders);
  const rateLimit = await checkSubmissionRateLimit(clientIp);

  if (!rateLimit.allowed) {
    return {
      ok: false,
      code: "RATE_LIMITED",
      retryAfterSeconds: rateLimit.retryAfterSeconds,
      error: `Too many submissions from this network. Try again in ${rateLimit.retryAfterSeconds}s.`,
    };
  }

  const result = await createFeedback(input);
  if (result.ok) {
    revalidatePath("/dashboard");
  }
  return result;
}
