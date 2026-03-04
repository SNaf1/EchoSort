import fs from "node:fs";
import path from "node:path";

import { Prisma, PrismaClient } from "@prisma/client";

function loadEnvFromDotEnvIfNeeded() {
  if (process.env.DATABASE_URL) return;
  const envPath = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eqIndex = line.indexOf("=");
    if (eqIndex < 1) continue;
    const key = line.slice(0, eqIndex).trim();
    if (process.env[key]) continue;
    const value = line.slice(eqIndex + 1).trim().replace(/^"(.*)"$/, "$1");
    process.env[key] = value;
  }
}

type RawCommandResult = {
  ok?: number;
  n?: number;
  nModified?: number;
};

const prisma = new PrismaClient();

const priorityFixes: Array<{ from: number | string; to: string }> = [
  { from: 1, to: "Low" },
  { from: 2, to: "Medium" },
  { from: 3, to: "High" },
  { from: 4, to: "Urgent" },
  { from: 5, to: "Critical" },
  { from: "1", to: "Low" },
  { from: "2", to: "Medium" },
  { from: "3", to: "High" },
  { from: "4", to: "Urgent" },
  { from: "5", to: "Critical" },
  { from: "P1", to: "Low" },
  { from: "P2", to: "Medium" },
  { from: "P3", to: "High" },
  { from: "P4", to: "Urgent" },
  { from: "P5", to: "Critical" },
];

async function runUpdate(update: Prisma.InputJsonObject) {
  return (await prisma.$runCommandRaw({
    update: "Feedback",
    updates: [update] as Prisma.InputJsonValue[],
  })) as RawCommandResult;
}

async function normalizeDateField(field: string) {
  const query = { [field]: { $type: "string" } } as Prisma.InputJsonObject;
  const pipelineUpdate = [
    {
      $set: {
        [field]: {
          $convert: {
            input: `$${field}`,
            to: "date",
            onError: "$$NOW",
            onNull: "$$NOW",
          },
        },
      },
    },
  ] as unknown as Prisma.InputJsonValue;

  const result = await runUpdate({
    q: query,
    u: pipelineUpdate,
    multi: true,
  } as Prisma.InputJsonObject);

  return Number(result.nModified ?? 0);
}

async function main() {
  loadEnvFromDotEnvIfNeeded();

  let totalPriorityModified = 0;
  for (const fix of priorityFixes) {
    const result = await runUpdate({
      q: { priority: fix.from },
      u: { $set: { priority: fix.to } },
      multi: true,
    });
    totalPriorityModified += Number(result.nModified ?? 0);
  }

  const teamResult = await runUpdate({
    q: { assignedTeam: "Support" },
    u: { $set: { assignedTeam: "Operations" } },
    multi: true,
  });
  const teamModified = Number(teamResult.nModified ?? 0);

  const statusBackfill = await runUpdate({
    q: { status: { $exists: false } },
    u: { $set: { status: "New" } },
    multi: true,
  });

  const activityBackfill = await runUpdate({
    q: { lastActivityAt: { $exists: false } },
    u: { $currentDate: { lastActivityAt: true } },
    multi: true,
  });

  const reminderCountBackfill = await runUpdate({
    q: { reminderCount: { $exists: false } },
    u: { $set: { reminderCount: 0 } },
    multi: true,
  });

  const followupBackfill = await runUpdate({
    q: { allowFollowup: { $exists: false } },
    u: { $set: { allowFollowup: true } },
    multi: true,
  });

  const workspaceBackfill = await runUpdate({
    q: { workspaceId: { $exists: false } },
    u: { $set: { workspaceId: "legacy-workspace" } },
    multi: true,
  });

  const dateFields = [
    "createdAt",
    "updatedAt",
    "notifiedAt",
    "resolvedAt",
    "closedAt",
    "lastActivityAt",
    "lastReminderAt",
  ];
  const normalizedDates: Record<string, number> = {};
  for (const field of dateFields) {
    normalizedDates[field] = await normalizeDateField(field);
  }

  const sanity = await prisma.feedback.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      priority: true,
      assignedTeam: true,
      category: true,
    },
  });

  console.log(`Priority records migrated: ${totalPriorityModified}`);
  console.log(`Team records migrated (Support -> Operations): ${teamModified}`);
  console.log(`Status backfilled: ${Number(statusBackfill.nModified ?? 0)}`);
  console.log(`Last activity backfilled: ${Number(activityBackfill.nModified ?? 0)}`);
  console.log(`Reminder count backfilled: ${Number(reminderCountBackfill.nModified ?? 0)}`);
  console.log(`Follow-up consent backfilled: ${Number(followupBackfill.nModified ?? 0)}`);
  console.log(`Workspace backfilled: ${Number(workspaceBackfill.nModified ?? 0)}`);
  for (const field of dateFields) {
    console.log(`Date field normalized (${field}): ${normalizedDates[field]}`);
  }
  console.log("Sample records after migration:");
  console.table(sanity);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
