import type { AnalysisStatus } from "@prisma/client";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

import { FEEDBACK_FALLBACK_ANALYSIS } from "@/lib/constants";
import { getServerEnv } from "@/lib/env";
import {
  FeedbackAnalysisSchema,
  type FeedbackAnalysis,
} from "@/lib/schemas/feedback";

export type FeedbackAnalysisResult = {
  analysis: FeedbackAnalysis;
  analysisStatus: AnalysisStatus;
  analysisError: string | null;
};

export function buildFallbackAnalysis(error: unknown): FeedbackAnalysisResult {
  const message = error instanceof Error ? error.message : "Unknown model error.";
  return {
    analysis: FEEDBACK_FALLBACK_ANALYSIS,
    analysisStatus: "FAILED",
    analysisError: message,
  };
}

export async function analyzeFeedbackWithAI(message: string): Promise<FeedbackAnalysisResult> {
  try {
    const env = getServerEnv();
    if (!env.GOOGLE_API_KEY) {
      return buildFallbackAnalysis(
        new Error("GOOGLE_API_KEY is missing. AI analysis fallback applied.")
      );
    }

    const model = new ChatGoogleGenerativeAI({
      model: env.GEMINI_MODEL,
      apiKey: env.GOOGLE_API_KEY,
      temperature: 0.1,
    });

    const structuredModel = model.withStructuredOutput(FeedbackAnalysisSchema, {
      name: "feedback_analysis",
    });

    const prompt = [
      "ROLE: You are an enterprise-grade feedback triage classifier.",
      "TASK: Extract sentiment, priority, category, and assigned team from the user feedback.",
      "OUTPUT RULE: Return only the structured schema fields. No extra keys, no prose.",
      "",
      "ALLOWED VALUES:",
      "- sentiment: positive | neutral | negative",
      "- priority: Low | Medium | High | Urgent | Critical",
      "- category: Bug | Feature | UI | Billing | Other",
      "- assignedTeam: Engineering | Product | Finance | Operations",
      "",
      "CLASSIFICATION POLICY:",
      "1) Use only evidence present in the feedback text. Do not invent missing context.",
      "2) If feedback mentions crashes, errors, broken behavior, data loss, or failed functionality: category=Bug, team=Engineering.",
      "3) If feedback asks for a new capability or enhancement: category=Feature, team=Product.",
      "4) If feedback is about layout, usability, readability, interaction friction, or visual polish: category=UI, team=Product unless there is clear implementation breakage (then Engineering).",
      "5) If feedback is about invoices, refunds, charges, subscriptions, payment methods, taxes, or pricing disputes: category=Billing, team=Finance.",
      "6) If none of the above clearly applies: category=Other, team=Operations.",
      "",
      "PRIORITY POLICY:",
      "- Critical: production blocker, severe outage, data loss, security risk, or cannot complete core workflow.",
      "- Urgent: major workflow impairment with significant user impact but not full outage.",
      "- High: clear recurring pain point or defect with strong impact but workable fallback exists.",
      "- Medium: meaningful improvement request or moderate issue with limited impact.",
      "- Low: minor polish request, edge-case annoyance, or low-impact suggestion.",
      "",
      "HALLUCINATION CONTROL:",
      "- If certainty is low, choose the safest conservative label.",
      "- Never infer urgency beyond what the text supports.",
      "- Prefer Operations for ambiguous non-billing, non-bug, non-feature, non-UI feedback.",
      "",
      `FEEDBACK:\n\"\"\"${message}\"\"\"`,
    ].join("\n");

    const analysis = await structuredModel.invoke(prompt);
    return {
      analysis,
      analysisStatus: "SUCCESS",
      analysisError: null,
    };
  } catch (error) {
    return buildFallbackAnalysis(error);
  }
}
