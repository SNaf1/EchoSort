# EchoSort

EchoSort is a no-auth feedback intelligence system built with Next.js App Router, Prisma + MongoDB Atlas, and LangChain + Gemini.

It provides:
- `/submit` for user feedback submission
- `/dashboard` for AI-enriched feedback triage
- `/dashboard/settings` for team email routing configuration

## Stack
- Next.js `16.1.6` (App Router, TypeScript strict)
- Tailwind CSS v4 + shadcn/ui + Framer Motion + Lucide
- Prisma ORM + MongoDB Atlas
- LangChain.js + `@langchain/google-genai` (`gemini-3-flash-preview`)
- SMTP email notifications via Nodemailer (Gmail app password)
- TanStack Table + Nivo line chart
- Vitest test suite

## Core Features
- AI structured extraction with Zod schema:
  - `sentiment` (`positive | neutral | negative`)
  - `priority` (`Low | Medium | High | Urgent | Critical`)
  - `category` (`Bug | Feature | UI | Billing | Other`)
  - `assignedTeam` (`Engineering | Product | Finance | Operations`)
- High-performance server action pipeline:
  1. Validate input with Zod
  2. Analyze with Gemini using `withStructuredOutput`
  3. Save enriched data to MongoDB
  4. Send team email if settings + SMTP are configured
- Fallback behavior:
  - If AI fails, ticket is still saved with safe fallback metadata
  - If notification settings/SMTP are missing, ticket is still saved
- UX polish:
  - Glassmorphic dashboard and bento KPI layout
  - Command-style modal with staged AI thinking states
  - Dashboard `Ctrl/Cmd+K` shortcut
  - Optimistic updates (`useOptimistic`)
  - Skeleton loaders and route error boundaries
  - Dark mode default with toggle
- Professional ticket operations:
  - Status lifecycle (`New`, `InProgress`, `Pending`, `Resolved`, `Closed`)
  - Row click opens full ticket detail page
  - Assignment, comments, and activity timeline
  - Agentic reminder actions with AI-drafted reminder copy + SMTP send

## Project Structure
```text
src/
  app/
    submit/
    dashboard/
      settings/
    actions/
  components/
    dashboard/
    feedback/
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
prisma/
tests/
```

## 1) Prerequisites
- Node.js `>=22`
- npm `>=10`
- MongoDB Atlas account
- Google AI Studio API key
- Gmail account with 2-Step Verification and App Password

## 2) Environment Variables (exactly where to paste)
Create a file:
- `H:\Uni work\Projects\EchoSort\.env`

Copy from `.env.example` and fill values:

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

`/.env` is gitignored. Do not commit real keys.

## 3) How To Get Each Secret

### MongoDB Atlas `DATABASE_URL`
1. Go to MongoDB Atlas.
2. Create a free cluster.
3. Open **Database Access** and create a DB user.
4. Open **Network Access** and allow your IP (or `0.0.0.0/0` for dev only).
5. Click **Connect** -> **Drivers**.
6. Copy the connection string.
7. Replace:
   - `<dbUser>` with your DB username
   - `<password>` with URL-encoded password
   - database name with `echosort`
8. Paste into `.env` as `DATABASE_URL`.

### Google Gemini `GOOGLE_API_KEY`
1. Go to Google AI Studio.
2. Generate a new API key.
3. Paste into `.env` as `GOOGLE_API_KEY`.
4. Keep `GEMINI_MODEL="gemini-3-flash-preview"`.

### Gmail SMTP (`SMTP_USER`, `SMTP_PASS`)
1. Enable Google 2-Step Verification.
2. Generate an **App Password** in Google account security settings.
3. Set:
   - `SMTP_USER` = your Gmail address
   - `SMTP_PASS` = app password
   - `SMTP_FROM` = `EchoSort <your_gmail_address>`

## 4) Local Setup
Run in project root:

```bash
npm.cmd install
npx.cmd prisma generate
npx.cmd prisma db push
npm.cmd run dev
```

Then open:
- `http://localhost:3000/submit`
- `http://localhost:3000/dashboard`
- `http://localhost:3000/dashboard/settings`

## 5) Manual Seed (optional)
Seed script is manual by design.

```bash
npm.cmd run seed
```

This wipes existing feedback and inserts sample records.

## 6) Tests and Quality Checks
```bash
npm.cmd run lint
npx.cmd tsc --noEmit
npx.cmd vitest run
npm.cmd run build
```

## 7) Deployment on Vercel (Free Tier)
1. Push project to GitHub (without `.env`).
2. Import repo into Vercel.
3. In **Project Settings -> Environment Variables**, add all keys from `.env`.
4. Deploy.
5. Validate:
   - submit flow creates feedback
   - dashboard shows AI enrichment
   - settings save works
   - SMTP emails send when fully configured

## 8) Operational Notes
- Dashboard and settings routes are dynamic server-rendered pages.
- If team recipient settings are incomplete, app shows a warning but still accepts feedback.
- If Gemini fails, feedback is saved with fallback metadata and `analysisStatus=FAILED`.
- If SMTP fails, feedback is saved and `notificationStatus=FAILED`.
- Existing old data can be normalized with `npm run repair:data` after schema upgrades.

## 9) Scripts
- `npm run dev` - start dev server
- `npm run build` - production build
- `npm run start` - run production server
- `npm run lint` - eslint
- `npm run test` - vitest with coverage
- `npm run test:watch` - vitest watch
- `npm run seed` - run Prisma seed script
- `npm run repair:data` - repair legacy enum/data values in MongoDB
- `npm run prisma:generate` - generate Prisma client
- `npm run prisma:push` - push schema to MongoDB

## 10) Assignment Requirement Mapping
- Backend feedback creation: implemented via Next.js server actions.
- MongoDB persistence: implemented with Prisma + Atlas-ready schema.
- SPA feedback list + modal creation: implemented in dashboard + shared modal.
- Search by name/category/priority: implemented with fuzzy query + multi-select filters.
- LangChain extraction: implemented with structured Zod output + Gemini.
- Optional team email: implemented via SMTP and settings-managed routing.
