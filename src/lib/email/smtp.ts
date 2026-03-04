import type { Team } from "@prisma/client";
import nodemailer from "nodemailer";

import { getServerEnv } from "@/lib/env";

type NotificationPayload = {
  recipient: string;
  team: Team;
  feedbackName: string;
  feedbackEmail: string;
  message: string;
  category: string;
  sentiment: string;
  priority: "Low" | "Medium" | "High" | "Urgent" | "Critical";
};

let transport: nodemailer.Transporter | null = null;

function getTransport() {
  if (transport) return transport;
  const env = getServerEnv();

  transport = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth:
      env.SMTP_USER && env.SMTP_PASS
        ? {
            user: env.SMTP_USER,
            pass: env.SMTP_PASS,
          }
        : undefined,
  });

  return transport;
}

export function canUseSmtp() {
  const env = getServerEnv();
  return Boolean(env.SMTP_USER && env.SMTP_PASS);
}

function resolveFromAddress() {
  const env = getServerEnv();
  if (env.SMTP_FROM && env.SMTP_FROM.trim().length > 0) return env.SMTP_FROM;
  if (env.SMTP_USER) return `EchoSort <${env.SMTP_USER}>`;
  throw new Error("SMTP_FROM or SMTP_USER is required for sender identity.");
}

export async function sendTeamNotification(payload: NotificationPayload) {
  if (!canUseSmtp()) {
    throw new Error(
      "SMTP credentials are incomplete. Set SMTP_USER and SMTP_PASS."
    );
  }

  const subject = `[EchoSort] ${payload.team} ticket: ${payload.category} (${payload.priority})`;
  const text = [
    `New feedback assigned to ${payload.team}.`,
    "",
    `From: ${payload.feedbackName} <${payload.feedbackEmail}>`,
    `Priority: ${payload.priority}`,
    `Sentiment: ${payload.sentiment}`,
    `Category: ${payload.category}`,
    "",
    "Message:",
    payload.message,
  ].join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #101010;">
      <h2 style="margin: 0 0 12px;">New EchoSort Feedback Assigned</h2>
      <p><strong>Team:</strong> ${payload.team}</p>
      <p><strong>From:</strong> ${payload.feedbackName} (${payload.feedbackEmail})</p>
      <p><strong>Priority:</strong> ${payload.priority}</p>
      <p><strong>Sentiment:</strong> ${payload.sentiment}</p>
      <p><strong>Category:</strong> ${payload.category}</p>
      <hr />
      <p style="white-space: pre-wrap;">${payload.message}</p>
    </div>
  `;

  await getTransport().sendMail({
    from: resolveFromAddress(),
    replyTo: payload.feedbackEmail,
    to: payload.recipient,
    subject,
    text,
    html,
  });
}

type ReminderPayload = {
  recipient: string;
  subject: string;
  body: string;
};

export async function sendReminderEmail(payload: ReminderPayload) {
  if (!canUseSmtp()) {
    throw new Error(
      "SMTP credentials are incomplete. Set SMTP_USER and SMTP_PASS."
    );
  }
  const html = payload.body
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p style="margin: 0 0 10px;">${line}</p>`)
    .join("");

  await getTransport().sendMail({
    from: resolveFromAddress(),
    to: payload.recipient,
    subject: payload.subject,
    text: payload.body,
    html: `<div style="font-family: Arial, sans-serif; color:#101010; line-height:1.6;">${html}</div>`,
  });
}
