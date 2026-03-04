# EchoSort

EchoSort is a full-stack User Feedback Intelligence System built for fast triage and internal ticket handling.

The product is intentionally **no-auth** for demo speed, and uses **workspace isolation** (cookie + DB scoping) so each visitor sees an independent dataset.

## What It Does

- Collects feedback from `/submit`.
- Enriches each ticket with AI classification (sentiment, priority, category, assigned team).
- Stores enriched tickets in MongoDB via Prisma.
- Surfaces tickets in `/dashboard` with search, filters, trends, and status workflows.
- Supports internal operations on each ticket (details page, assignee, status transitions, comments, activity log).
- Sends routed team notifications by email (SMTP).
- Supports AI-assisted reminder drafting before send.

## Product Surfaces

- `/submit`: end-user feedback intake.
- `/dashboard`: list, filters, KPIs, trend chart, stale-ticket reminder workflow.
- `/dashboard/tickets/[id]`: full ticket operations and history.
- `/dashboard/settings`: team email routing, theme settings, and workspace reset.

## Core Technical Stack

- Next.js 16 (App Router, TypeScript strict)
- Tailwind CSS v4 + shadcn/ui + Framer Motion + Lucide
- Prisma ORM + MongoDB Atlas
- LangChain.js + `@langchain/google-genai` (`gemini-3-flash-preview`)
- Nodemailer (SMTP)
- TanStack Table + Nivo Line Chart
- Vitest + Testing Library

## AI Intelligence Layer

Feedback analysis uses LangChain structured output with Zod schema.

Extracted fields:

- `sentiment`: `positive | neutral | negative`
- `priority`: `Low | Medium | High | Urgent | Critical`
- `category`: `Bug | Feature | UI | Billing | Other`
- `assignedTeam`: `Engineering | Product | Finance | Operations`

Implementation references:

- `src/lib/ai/feedback-analyzer.ts`
- `src/lib/schemas/feedback.ts`

Behavior guarantees:

- Invalid input is rejected by Zod before persistence.
- AI failure does **not** block persistence.
- On AI failure, safe fallback metadata is stored with `analysisStatus=FAILED`.

## Ticket Lifecycle and Operations

Ticket states:

- `New`, `InProgress`, `Pending`, `Resolved`, `Closed`

Operational capabilities:

- Update status with reason/summary where needed.
- Assign owner (`assigneeName`).
- Add internal comments.
- Track activities and reminder history.
- Draft reminder email with AI, then edit and send manually.

Key files:

- `src/lib/tickets/ticket-service.ts`
- `src/components/tickets/ticket-details-client.tsx`
- `src/components/tickets/reminder-compose-drawer.tsx`

## Workspace Isolation (No Auth)

EchoSort uses anonymous workspace IDs to isolate data without login:

- A `es_workspace` HTTP-only cookie is set automatically.
- `Feedback` and `NotificationSettings` are scoped by `workspaceId`.
- Dashboard queries and ticket actions always resolve current workspace first.
- A "Start New Workspace" action rotates the cookie for a fresh empty view.

Key files:

- `src/proxy.ts`
- `src/lib/workspace/workspace.ts`
- `src/components/settings/workspace-controls-card.tsx`

## Data Model (Prisma + MongoDB)

Primary models:

- `Feedback`
- `NotificationSettings`
- `FeedbackComment`
- `FeedbackActivity`
- `FeedbackReminder`

Schema reference:

- `prisma/schema.prisma`

## Environment Variables

Create `.env` in project root and keep it private.

```env
DATABASE_URL="mongodb+srv://<dbUser>:<urlEncodedPassword>@<cluster-host>/echosort?retryWrites=true&w=majority&appName=<clusterName>"

GOOGLE_API_KEY="<your_google_ai_studio_key>"
GEMINI_MODEL="gemini-3-flash-preview"

SMTP_HOST="smtp.gmail.com"
SMTP_PORT="465"
SMTP_SECURE="true"
SMTP_USER="<your_gmail_address>"
SMTP_PASS="<your_google_app_password>"
SMTP_FROM="EchoSort <your_gmail_address>"
```

Notes:

- `SMTP_FROM` is optional; fallback is `EchoSort <SMTP_USER>`.
- Reporter email is used as `replyTo` for team notifications.
- Never commit `.env`.

## Local Development

```bash
npm install
npx prisma generate
npx prisma db push
npm run dev
```

Open:

- `http://localhost:3000/submit`
- `http://localhost:3000/dashboard`
- `http://localhost:3000/dashboard/settings`

## Quality Checks

```bash
npm run lint
npx tsc --noEmit
npm run test
npm run build
```

## Deployment (Vercel)

1. Push repository to GitHub.
2. Import the project in Vercel.
3. Add all environment variables from local `.env` into Vercel project settings.
4. Ensure production branch is `main`.
5. Deploy.

MongoDB/Prisma note:

- Prisma + MongoDB uses `db push` (not SQL migrations).
- Run schema push against the production DB when schema changes:

```bash
npx prisma db push
```

## Scripts

- `npm run dev` - start local dev server
- `npm run build` - production build
- `npm run start` - run production server
- `npm run lint` - lint checks
- `npm run test` - test suite with coverage
- `npm run test:watch` - watch mode tests
- `npm run seed` - seed sample data
- `npm run repair:data` - normalize legacy data
- `npm run prisma:generate` - generate Prisma client
- `npm run prisma:push` - push schema to MongoDB

## Project Structure

```text
src/
  app/
    submit/
    dashboard/
      settings/
      tickets/[id]/
    actions/
  components/
    dashboard/
    tickets/
    settings/
    submit/
    theme/
    ui/
  lib/
    ai/
    dashboard/
    email/
    feedback/
    schemas/
    settings/
    tickets/
    workspace/
prisma/
tests/
scripts/
```
