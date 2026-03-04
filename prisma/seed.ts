import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const sampleFeedback = [
  {
    name: "Ava Thompson",
    email: "ava@example.com",
    message:
      "The billing page charged my card twice for the same invoice and support chat timed out.",
    sentiment: "negative" as const,
    priority: "Critical" as const,
    category: "Billing" as const,
    assignedTeam: "Finance" as const,
    allowFollowup: true,
  },
  {
    name: "Nate Rivera",
    email: "nate@example.com",
    message: "Please add keyboard shortcuts for switching between project views.",
    sentiment: "neutral" as const,
    priority: "Medium" as const,
    category: "Feature" as const,
    assignedTeam: "Product" as const,
    allowFollowup: true,
  },
  {
    name: "Chloe Kim",
    email: "chloe@example.com",
    message:
      "After the latest update, the save button in settings is invisible in dark mode.",
    sentiment: "negative" as const,
    priority: "High" as const,
    category: "UI" as const,
    assignedTeam: "Engineering" as const,
    allowFollowup: true,
  },
  {
    name: "Ryan Patel",
    email: "ryan@example.com",
    message:
      "Love the dashboard speed now. The new table load feels way faster than last month.",
    sentiment: "positive" as const,
    priority: "Low" as const,
    category: "Other" as const,
    assignedTeam: "Operations" as const,
    allowFollowup: true,
  },
  {
    name: "Mia Collins",
    email: "mia@example.com",
    message:
      "The app crashes whenever I upload a CSV with more than 2k rows in the import wizard.",
    sentiment: "negative" as const,
    priority: "Critical" as const,
    category: "Bug" as const,
    assignedTeam: "Engineering" as const,
    allowFollowup: true,
  },
];

async function main() {
  await prisma.feedback.deleteMany({});
  await prisma.notificationSettings.deleteMany({});

  const workspaceId = "seed-workspace";

  await prisma.feedback.createMany({
    data: sampleFeedback.map((item, index) => ({
      ...item,
      workspaceId,
      analysisStatus: "SUCCESS",
      notificationStatus: "SKIPPED",
      createdAt: new Date(Date.now() - index * 1000 * 60 * 60 * 6),
      updatedAt: new Date(Date.now() - index * 1000 * 60 * 60 * 6),
    })),
  });

  console.log(`Seeded ${sampleFeedback.length} feedback items.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
