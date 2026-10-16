# VisualLearn

An original visual learning experience and a draft HCI study platform. Built from an empty repository using the supplied [v2 implementation specification](VISUALLEARN_AGENT_IMPLEMENTATION_SPEC.md).

**Status:** Runnable public lesson/demo and tested E1 research services. **Not approved for human research or ready for recruitment.** No human participants or research results are seeded. See [progress](docs/IMPLEMENTATION_PROGRESS.md) and [decisions](docs/DECISIONS.md) for exact limitations.

## Run the public demo

Requires Node.js 24 and npm 11. No database, account or credentials needed for the demo.

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Open http://127.0.0.1:3000. Explore `/courses/water-cycle`, then `/demo/water-cycle`. The five-chapter lesson has fixed audio, full transcripts, three SVG density variants, refresh recovery and a separate practice quiz. Demo progress stays in local storage; practice answers are scored without persistence. Reset demo removes its progress.

For a production preview, stop the dev server, run `npm run build`, then `npm start`. Set `APP_BASE_URL` to the actual public origin; mutating endpoints fail closed without it in production. Do not run build and dev against the same `.next` directory concurrently.

## Architecture

- Next.js App Router, React, strict TypeScript, Tailwind CSS, shadcn-style Radix/CVA button primitives and Lucide icons.
- `content/lessons/water-cycle/v1.json`: canonical text and narration references. `components/learning/water-diagram.tsx`: original SVG with essential/supportive/decorative tiers.
- `lib/assessments/questions.server.ts`: server-only A/B/C research banks and separate P practice bank. No keys or rationales are passed to client components. Instruments are drafts.
- `lib/study/service.ts`: transactional E1 lifecycle, assignment, progress, scoring, questionnaires, one-hour eligibility, recovery and withdrawal.
- `supabase/migrations/001_research_foundation.sql`: private PostgreSQL schema, RLS, constraints, allocation lock, attempts, surveys, follow-ups, events, audit and rubric rating tables. Fresh v2 schema; no legacy data existed.
- `/api/study/*`: authenticated same-origin operations using signed HttpOnly cookies, bounded bodies, validation, rate limits and transactions. `/study/session`: participant flow.
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
```

`db:validate` runs the actual migration and seed in disposable PGlite PostgreSQL. Multi-connection races and hosted Supabase Auth require staging validation. Playwright checks the demo, closed research/admin gates, key leakage, keyboard access, horizontal overflow and axe at 360/768/1280 px. CI runs checks serially before the build.

## Content and narration

Copy and diagrams are original. Scientific concepts were checked against [USGS Water Science School](https://www.usgs.gov/water-science-school/water-cycle). No third-party educational artwork was copied. Five real WAV files contain development narration synthesized locally with Windows System.Speech. Their redistribution rights and educational suitability still need review; they are **not approved study recordings**. See [source register](docs/CONTENT_SOURCES.md).

`npm run verify-content` checks frozen SHA-256 content/audio hashes and valid nonempty WAVs. `scripts/generate-narration.ps1` regenerates development audio on Windows; this deliberately invalidates the manifest. After review/versioning, `node scripts/verify-content.mjs --write` freezes new hashes. Never alter frozen stimuli during a trial.

## Current limits

No hosted database/auth credentials or deployment were provided. Live migrations, real administrator login, PostgreSQL multi-client concurrency, connected participant browser flow and actual exports from Supabase have not been verified. Content/instruments/consent are unreviewed. The draft form set currently uses objective MCQs plus manually scored free recall; richer ordering/labeling/scenario ratings, a blind-rater UI, optional seven-day form D, full analysis charts and final debrief remain to implement. Narration licensing, protocol registration, final time window, data retention and human-research approvals remain external blockers. No claim of research readiness is made.

## Continuing work

Read `AGENTS.md`, the specification and `docs/IMPLEMENTATION_PROGRESS.md`. Preserve demo/research isolation. Use the existing feature branch and update progress with actual command outputs. Next: validate the connected E1 workflow in an authorized Supabase staging project using explicitly synthetic test records, then address the remaining acceptance matrix before recruitment.
