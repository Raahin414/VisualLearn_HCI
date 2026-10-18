# VisualLearn

An original visual learning experience and a draft HCI study platform. Built from an empty repository using the supplied [v2 implementation specification](VISUALLEARN_AGENT_IMPLEMENTATION_SPEC.md).

**Status:** Runnable local MVP with a public lesson, v2 assessments (ordering, diagram labeling, written scenario and recall), questionnaire drafts, a development-only study simulation, and an E1 research workflow verified against real PostgreSQL and a local Supabase stack (Auth with MFA). No hosted staging or deployment exists yet. **Not approved for human research or ready for recruitment.** No human participants or research results are seeded. See [progress](PROGRESS.md), [roadmap](ROADMAP.md) and [decisions](docs/DECISIONS.md).

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
2. Complete baseline A, visit the five chapters, then immediate form B: part 1 is the written free recall and scenario (locked once you continue), part 2 the multiple-choice, ordering and diagram-labeling items. Then F3. Assessment and questionnaire drafts survive refresh in the same tab.
3. Check the locked follow-up. Use **Advance to +60 minutes**, then open C and submit F5. Use **Advance past deadline** in a fresh waiting session to demonstrate expiry.
4. Inspect the simulated researcher overview below. It shows submitted checkpoints, never invented grades or empirical findings. Reset clears the fixture. Its tab-specific drafts expire with the tab and a fresh ID is used for each new fixture.

This is a browser simulation, **not a database or authentication test**. It reuses participant screens, canonical lesson, sanitized question forms, survey validators and timing helpers. It does not call research APIs, write PostgreSQL, create consent records, score research answers or generate genuine return links. It is available only when `NODE_ENV=development`; the route returns 404 in a production build. Live `/api/study/*` eligibility and approval checks remain unchanged. Do not enter identifying or real participant information.

For real database and authentication checks, see the connected suites under [Checks](#checks); they need Docker but no accounts.

## Architecture

- Next.js App Router, React, strict TypeScript, Tailwind CSS, shadcn-style Radix/CVA button primitives and Lucide icons.
- `content/lessons/water-cycle/v1.json`: canonical text and narration references. `components/learning/water-diagram.tsx`: original SVG with essential/supportive/decorative tiers.
- `lib/assessments/questions.server.ts`: server-only A/B/C research banks (one shared blueprint: recall MCQs, ordering, diagram labeling, conceptual, transfer) and separate P practice bank. `rubrics.server.ts`: free-recall and scenario rubrics. No keys, rationales or rubrics reach client components (`npm run check:bundle`). Instruments are drafts.
- `lib/study/service.ts`: transactional E1 lifecycle, assignment, progress, scoring, questionnaires, one-hour eligibility, recovery and withdrawal.
- `supabase/migrations/`: `001` private PostgreSQL schema, RLS, constraints, allocation lock, attempts, surveys, follow-ups, events, audit and rating tables; `002` item scores, scenario responses, per-kind blind ratings and adjudication. `supabase/roles/runtime_role.sql`: non-owner runtime login. `supabase/config.toml`: local Supabase stack for rehearsal only.
- `/api/study/*`: authenticated same-origin operations using signed HttpOnly cookies, bounded bodies, validation, rate limits and transactions. `/study/session`: participant flow.
- `components/assessments/assessment-form.tsx` and `item-inputs.tsx`: shared accessible progress, staged written part, ordering selects, neutral labeling diagram, scoped tab drafts, validation, first-missing-answer focus and retry-safe submission. `components/surveys/survey-form.tsx`: F3/F5 with the same draft model.
- `/dev/study`: development-only browser fixture transport for the same participant screens, synthetic checkpoint overview and isolated clock controls. No research DB fallback is used.
- `/admin`: Supabase Auth sign-in, UUID allowlist, mandatory TOTP MFA, dashboard (allocation, funnel, scores, retention, follow-up status, data quality, versions, rating coverage), blind scoring with adjudication, audited item-level exports, `codebook.json` and `data_dictionary.md`. No public participant data.
- `tests/`: unit, PGlite schema tests, real PostgreSQL concurrency tests (`tests/postgres`), Playwright/axe browser tests (`tests/e2e`) and the connected SYNTHETIC suite (`tests/connected`). PGlite is test-only, never a live research storage fallback.

## Research database setup

Use a separate Supabase staging project with no real participants. Supply `DATABASE_URL` (PostgreSQL connection), `SESSION_SECRET` (at least 32 random bytes), `SUPABASE_URL`, `SUPABASE_ANON_KEY` and `ADMIN_ALLOWLIST` (comma-separated Supabase user UUIDs). Secrets stay in ignored `.env.local` or deployment secret storage. No Supabase service key is needed by browsers.

```powershell
npm run db:migrate
npm run verify:staging   # reads ignored .env.staging.local; see .env.staging.example
```

Migration runs every pending file in one transaction with an advisory lock and a ledger in the private `visuallearn_ops` schema (a `public` ledger would be writable by Supabase's anon role). Seed is idempotent and creates eight **disabled draft** definitions only. Provision the runtime login with `supabase/roles/runtime_role.sql` and use it for `DATABASE_URL`; never the migration owner or a superuser. Keep `visuallearn` and `visuallearn_ops` outside the exposed API schemas. Researchers need an allowlisted UUID and an authenticator app. `verify:staging` audits all of this read-only. Step-by-step staging and hosting runbook: [deployment](docs/DEPLOYMENT.md).

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
npm run check:bundle
npm run test:e2e:production
npm run test:pg          # Docker: real PostgreSQL 17, multi-connection
npm run test:connected   # Docker: local Supabase Auth + PostgreSQL, full SYNTHETIC study and researcher flow
```

`db:validate` runs the migrations and seed in disposable PGlite. `test:pg` starts a throwaway loopback PostgreSQL 17 container, applies migrations with the real CLI, provisions the runtime login and tests concurrent enrollment/allocation, duplicate submissions, progress, follow-up timing, withdrawal and export integrity through the app's own transaction code. `test:connected` does the same on a local Supabase stack, runs `verify-staging`, and drives two browsers through the whole study plus researcher MFA, dashboard, exports and blind scoring. Time is advanced only by shifting a SYNTHETIC session's stored timestamps in the test database. Neither suite touches a hosted project. Playwright checks navigation, audio, draft recovery/retry, the development simulation, closed gates, key leakage, keyboard access, overflow and axe at 360/768/1280 px. Stop dev after `test:e2e`, build, then run `test:e2e:production`: its configuration starts/reuses the production server and explicitly requires 404 for the simulator. CI runs development tests, build and production boundary tests in that order.

## Content and narration

Copy and diagrams are original. Scientific concepts were checked against [USGS Water Science School](https://www.usgs.gov/water-science-school/water-cycle). No third-party educational artwork was copied. Five real WAV files contain development narration synthesized locally with Windows System.Speech. Their redistribution rights and educational suitability still need review; they are **not approved study recordings**. See [source register](docs/CONTENT_SOURCES.md).

`npm run verify-content` checks frozen SHA-256 content/audio hashes and valid nonempty WAVs. `scripts/generate-narration.ps1` regenerates development audio on Windows; this deliberately invalidates the manifest. After review/versioning, `node scripts/verify-content.mjs --write` freezes new hashes. Never alter frozen stimuli during a trial.

## Current limits

No hosted Supabase project, hosting account or credentials were available, so hosted migration, hosted Auth/MFA, backups/restore and deployment are unverified; the local Supabase rehearsal is the closest evidence. Content, instruments, rubrics, consent, narration rights, protocol, retention/deletion, debrief and ethics are unreviewed and unapproved ([review packets](docs/REVIEW_PACKETS.md)). Optional seven-day form D, physical deletion after withdrawal, approved debrief and analysis charts remain to implement. No claim of research readiness is made.

## Continuing work

Read `AGENTS.md`, the specification and `PROGRESS.md`. Preserve demo/research isolation and update progress with actual outputs. Next: create the hosted staging project with the owner's account and follow [deployment](docs/DEPLOYMENT.md); obtain the external reviews. No live research before approval.
