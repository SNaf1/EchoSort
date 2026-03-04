import { rankItem } from "@tanstack/match-sorter-utils";

import { ticketSearchText } from "@/lib/ticket-id";
import type { FeedbackDTO } from "@/lib/types";

export type FeedbackFilters = {
  query: string;
  categories: string[];
  priorities: string[];
};

export const defaultFeedbackFilters: FeedbackFilters = {
  query: "",
  categories: [],
  priorities: [],
};

export function applyFeedbackFilters(items: FeedbackDTO[], filters: FeedbackFilters) {
  const normalizedQuery = filters.query.trim();

  return items.filter((item) => {
    const queryMatch =
      normalizedQuery.length === 0 ||
      [item.name, item.email, item.message, ticketSearchText(item.id)].some(
        (field) => rankItem(field, normalizedQuery).passed
      );
    const categoryMatch =
      filters.categories.length === 0 || filters.categories.includes(item.category);
    const priorityMatch =
      filters.priorities.length === 0 || filters.priorities.includes(item.priority);

    return queryMatch && categoryMatch && priorityMatch;
  });
}
