"use server";

import { revalidatePath } from "next/cache";

import {
  addTicketComment,
  assignTicket,
  getReminderDraftForTicket,
  sendReminderForTicket,
  updateTicketStatus,
} from "@/lib/tickets/ticket-service";
import type {
  AddTicketCommentInput,
  AssignTicketInput,
  DraftReminderInput,
  SendReminderInput,
  UpdateTicketStatusInput,
} from "@/lib/schemas/tickets";

export async function updateTicketStatusAction(input: UpdateTicketStatusInput) {
  const result = await updateTicketStatus(input);
  if (result.ok) {
    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/tickets/${input.ticketId}`);
  }
  return result;
}

export async function assignTicketAction(input: AssignTicketInput) {
  const result = await assignTicket(input);
  if (result.ok) {
    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/tickets/${input.ticketId}`);
  }
  return result;
}

export async function addTicketCommentAction(input: AddTicketCommentInput) {
  const result = await addTicketComment(input);
  if (result.ok) {
    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/tickets/${input.ticketId}`);
  }
  return result;
}

export async function draftReminderAction(input: DraftReminderInput) {
  const result = await getReminderDraftForTicket(input);
  if (result.ok) {
    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/tickets/${input.ticketId}`);
  }
  return result;
}

export async function sendReminderAction(input: SendReminderInput) {
  const result = await sendReminderForTicket(input);
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/tickets/${input.ticketId}`);
  return result;
}
