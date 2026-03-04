export const APP_NAME = "EchoSort";
export const APP_DESCRIPTION =
  "User feedback intelligence system with AI-powered routing.";

export const TEAM_OPTIONS = ["Engineering", "Product", "Finance", "Operations"] as const;
export const CATEGORY_OPTIONS = ["Bug", "Feature", "UI", "Billing", "Other"] as const;
export const SENTIMENT_OPTIONS = ["positive", "neutral", "negative"] as const;
export const STATUS_OPTIONS = ["New", "InProgress", "Pending", "Resolved", "Closed"] as const;
export const PRIORITY_OPTIONS = [
  "Low",
  "Medium",
  "High",
  "Urgent",
  "Critical",
] as const;
export const HIGH_PRIORITY_OPTIONS = ["High", "Urgent", "Critical"] as const;

const HIGH_PRIORITY_SET = new Set<string>(HIGH_PRIORITY_OPTIONS);

export function isHighPriority(priority: (typeof PRIORITY_OPTIONS)[number]) {
  return HIGH_PRIORITY_SET.has(priority);
}

export const FEEDBACK_FALLBACK_ANALYSIS = {
  sentiment: "neutral" as const,
  priority: "Medium" as const,
  category: "Other" as const,
  assignedTeam: "Operations" as const,
};

export const FEEDBACK_STAGED_MESSAGES = [
  "Analyzing sentiment...",
  "Scoring priority...",
  "Routing to the right team...",
] as const;

export const STALE_TICKET_HOURS = 48;
