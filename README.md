# VisualLearn

An original visual learning experience and a draft HCI study platform. Built from an empty repository using the supplied [v2 implementation specification](VISUALLEARN_AGENT_IMPLEMENTATION_SPEC.md).

**Status:** Runnable local MVP with a public lesson, resilient assessments, development-only study simulation and tested E1 research services. **Not approved for human research or ready for recruitment.** No human participants or research results are seeded. See [progress](PROGRESS.md), [roadmap](ROADMAP.md) and [decisions](docs/DECISIONS.md).

## Run the public demo

Requires Node.js 24 and npm 11. No database, account or credentials needed for the demo.

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Open http://127.0.0.1:3000. Explore `/courses/water-cycle`, then `/demo/water-cycle`. The five-chapter lesson has fixed audio, full transcripts, three SVG density variants, narration status, chapter progress, refresh recovery and a separate practice quiz. Lesson progress stays in local storage. Practice answer drafts stay in this tab’s session storage until successful submission; the scoring endpoint does not persist answers. Submission failures retain drafts for retry. Reset demo removes lesson progress.

For a production preview, stop the dev server, run `npm run build`, then `npm start`. Set `APP_BASE_URL` to the actual public origin; mutating endpoints fail closed without it in production. Do not run build and dev against the same `.next` directory concurrently.

## Demonstrate the study without Supabase

While `npm run dev` is running, open **http://127.0.0.1:3000/dev/study**.

1. Choose a simulated visual condition and start a **SYNTHETIC** browser session.
2. Complete baseline A, visit the five chapters, submit immediate B/free recall and F3. Objective answers and recall drafts survive refresh in the same tab.
3. Check the locked follow-up. Use **Advance to +60 minutes**, then open C and submit F5. Use **Advance past deadline** in a fresh waiting session to demonstrate expiry.
4. Inspect the simulated researcher overview below. It shows submitted checkpoints, never invented grades or empirical findings. Reset clears the fixture. Its tab-specific drafts expire with the tab and a fresh ID is used for each new fixture.

This is a browser simulation, **not a database or authentication test**. It reuses participant screens, canonical lesson, sanitized question forms, survey validators and timing helpers. It does not call research APIs, write PostgreSQL, create consent records, score research answers or generate genuine return links. It is available only when `NODE_ENV=development`; the route returns 404 in a production build. Live `/api/study/*` eligibility and approval checks remain unchanged. Do not enter identifying or real participant information.

Docker Desktop is installed on the development machine but its engine was unavailable during this milestone. No local database server was provisioned, no database architecture was introduced and no Supabase service was connected. Existing PostgreSQL migrations and PGlite integration tests are preserved.

## Architecture

- Next.js App Router, React, strict TypeScript, Tailwind CSS, shadcn-style Radix/CVA button primitives and Lucide icons.
- `content/lessons/water-cycle/v1.json`: canonical text and narration references. `components/learning/water-diagram.tsx`: original SVG with essential/supportive/decorative tiers.
- `lib/assessments/questions.server.ts`: server-only A/B/C research banks and separate P practice bank. No keys or rationales are passed to client components. Instruments are drafts.
- `lib/study/service.ts`: transactional E1 lifecycle, assignment, progress, scoring, questionnaires, one-hour eligibility, recovery and withdrawal.
- `supabase/migrations/001_research_foundation.sql`: private PostgreSQL schema, RLS, constraints, allocation lock, attempts, surveys, follow-ups, events, audit and rubric rating tables. Fresh v2 schema; no legacy data existed.
- `/api/study/*`: authenticated same-origin operations using signed HttpOnly cookies, bounded bodies, validation, rate limits and transactions. `/study/session`: participant flow.
- `components/assessments/assessment-form.tsx`: shared accessible answer progress, scoped tab drafts, explicit validation, first-missing-answer focus and retry-safe submission. Practice, pretest, immediate and delayed screens reuse it.
- `/dev/study`: development-only browser fixture transport for the same participant screens, synthetic checkpoint overview and isolated clock controls. No research DB fallback is used.
- `/admin`: Supabase Auth sign-in, UUID allowlist, aggregates and audited exports. No public participant data.
- `tests/`: unit, PGlite PostgreSQL integration, Playwright and axe checks. PGlite is test-only, never a live research storage fallback.

## Research database setup

Use a separate Supabase staging project with no real participants. Supply `DATABASE_URL` (PostgreSQL connection), `SESSION_SECRET` (at least 32 random bytes), `SUPABASE_URL`, `SUPABASE_ANON_KEY` and `ADMIN_ALLOWLIST` (comma-separated Supabase user UUIDs). Secrets stay in ignored `.env.local` or deployment secret storage. No Supabase service key is needed by browsers.

```powershell
npm run db:migrate
npm run db:validate
```

Migration runs in a transaction with a version table and advisory lock. Seed is idempotent and creates eight **disabled draft** definitions only. Apply with an authorized migration role able to create schemas/roles. Use a separate, non-owner runtime login granted membership in `visuallearn_backend`, with schema/table privileges inherited from that group. Do not use the migration owner or a PostgreSQL superuser at runtime. Keep `visuallearn` outside PostgREST exposed schemas; anon/authenticated roles receive no access. See [deployment](docs/DEPLOYMENT.md).

`STUDY_ENABLED=true` alone cannot open enrollment. E1 also requires database status `recruiting`, enabled flag, content and ethics approvals, approved consent version/text and study contact. **Do not set these fields as a substitute for approval.** Minors remain blocked even if generic consent is checked; a verified guardian workflow has not been implemented. E2–E8 cannot be activated by the current database constraint.

## Checks

```powershell
npm run verify-content
npm run lint
npm run typecheck
npm run test
npm run db:validate
npx playwright install chromium
npm run test:e2e
npm run build
npm run test:e2e:production
```

`db:validate` runs the actual migration and seed in disposable PGlite PostgreSQL. Multi-connection races and hosted Supabase Auth require later validation. Playwright checks navigation, audio, draft recovery/retry, the development simulation, closed gates, key leakage, keyboard access, overflow and axe at 360/768/1280 px. Stop dev after `test:e2e`, build, then run `test:e2e:production`: its configuration starts/reuses the production server and explicitly requires 404 for the simulator. CI runs development tests, build and production boundary tests in that order.

## Content and narration

Copy and diagrams are original. Scientific concepts were checked against [USGS Water Science School](https://www.usgs.gov/water-science-school/water-cycle). No third-party educational artwork was copied. Five real WAV files contain development narration synthesized locally with Windows System.Speech. Their redistribution rights and educational suitability still need review; they are **not approved study recordings**. See [source register](docs/CONTENT_SOURCES.md).

`npm run verify-content` checks frozen SHA-256 content/audio hashes and valid nonempty WAVs. `scripts/generate-narration.ps1` regenerates development audio on Windows; this deliberately invalidates the manifest. After review/versioning, `node scripts/verify-content.mjs --write` freezes new hashes. Never alter frozen stimuli during a trial.

## Current limits

No hosted database/auth credentials or deployment were provided. Live migrations, real administrator login, PostgreSQL multi-client concurrency, connected participant browser flow and actual exports from Supabase have not been verified. Content/instruments/consent are unreviewed. The draft form set currently uses objective MCQs plus manually scored free recall; richer ordering/labeling/scenario ratings, a blind-rater UI, optional seven-day form D, full analysis charts and final debrief remain to implement. Narration licensing, protocol registration, final time window, data retention and human-research approvals remain external blockers. No claim of research readiness is made.

## Continuing work

Read `AGENTS.md`, the specification and `PROGRESS.md`. Preserve demo/research isolation and update progress with actual outputs. Finish local assessment/content review and PostgreSQL concurrency checks before a separately authorized Supabase staging milestone. No deployment or live research is part of the current milestone.
