# VisualLearn

One Water Cycle course, three visual densities: **low, medium and high**. The project studies comprehension, immediate recall and one-hour retention while keeping canonical text, narration, objectives, controls and assessment rules identical. E1 is the only supported study. There is no modality/chunking/video/adaptive experiment catalog.

The application is deployed to staging at https://visuallearn-staging.vercel.app. Changes in this checkout are not deployed automatically: deployment uses the CLI, not a Git integration. Real recruitment remains closed pending the reviews in [docs/REVIEW_PACKETS.md](docs/REVIEW_PACKETS.md).

## Presentations

| Condition | Visual material |
|---|---|
| Low | One essential whole-cycle diagram, canonical text and narration |
| Medium | Same essentials plus supportive callouts and two process illustrations |
| High | Same essentials plus four process illustrations, supportive/repeated labels and decorative details |

The canvas, audio, full explanation, core controls and tests are shared. All visual additions repeat material already taught. This is a density package, not a separate test of visual relevance. The draft manipulation requires educator review; no condition is assumed to work best.

## Learner and researcher flow

- **Public preview:** `/courses/water-cycle` -> `/demo/water-cycle` -> separate practice quiz. The density selector is demo-only; practice results are not saved as research data.
- **Student participation:** visible navigation -> `/study/enroll` -> consent/F0 -> baseline A -> persisted server assignment -> five-chapter lesson -> immediate B + F3 -> one-hour C + F5 -> finish. All stages run inside `/study/session`. An approved optional D/F6 path remains off by default.
- **Return:** the original browser or private fragment-based return link restores the saved session. One-hour timing starts at server-recorded lesson completion, not at survey submission.
- **Researcher:** `/admin` requires Supabase Auth, allowlisted UUID and TOTP MFA. E1-only dashboard, blind written-response ratings, audited exports and protected codebook.
- **Development walkthrough:** `/dev/study` simulates the three densities with browser-only SYNTHETIC data and clock controls. It never calls research APIs, grades research responses or writes PostgreSQL. Production returns 404.

## Run locally

Node 24/npm 11:

```powershell
npm ci
# Copy .env.example to .env.local only if no local configuration exists.
npm run dev
```

Public preview requires no database or account. Research storage is PostgreSQL; PGlite is test-only. Keep populated env files and research exports outside Git. Stop dev before building; do not share .next between simultaneous dev/build servers.

## Upgrade existing databases

Apply migrations with an authorized owner using `npm run db:migrate`. Migration **006_e1_only.sql** archives and disables any historical non-E1 experiment, enforces E1-only activation/recruiting, and preserves participant records, answers, assignments and frozen session hashes. Fresh seed creates E1 only. Migrations 001-005 remain historical schema upgrades; never edit applied migrations or delete old data to simplify the catalog.

The revised presentation is `density-v6-e1-draft`, shared source `e1-v8-draft`. Canonical lesson, WAVs and A/B/C/D/P banks are unchanged. Existing frozen sessions are preserved but fail closed on incompatible hashes; do not rewrite their versions to make them resume.

No hosted database was changed by preparing this restructuring. Apply 006 before deploying this code. The read-only `npm run verify:staging` requires 001-006 and archived/disabled historical studies.

## Checks

```powershell
npm run verify-content
npm run lint
npm run typecheck
npm run test
npm run db:validate
npm run test:pg
npm run test:e2e
npm run build
npm run check:bundle
npm run test:e2e:production
npm run test:connected
python -m unittest discover -s analysis -p 'test_*.py'
```

Docker is required for native PostgreSQL and connected Supabase checks. These harnesses use disposable local services, never hosted research data. E1 checks cover low/medium/high parity, enrollment and fixed assignment, concurrency, retries, timing, recovery, ratings, export isolation and withdrawal. See [docs/QA.md](docs/QA.md) for actual run evidence; configured checks are not necessarily completed checks.

## Research boundaries

Enrollment requires `STUDY_ENABLED=true`, a recruiting/enabled E1 row, content/ethics approval and reviewed consent/contact. Do not use configuration flags as a substitute for approval. Only adults 18-30 can enroll; minors remain blocked. Narration redistribution rights, educator/instrument validation, protocol/sample/window decisions, debrief and retention procedures remain open. No human study results or validated-scale claims exist.

See [PROGRESS.md](PROGRESS.md), [ROADMAP.md](ROADMAP.md), [docs/DECISIONS.md](docs/DECISIONS.md), [docs/RESEARCH_PROTOCOL.md](docs/RESEARCH_PROTOCOL.md) and [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). The original implementation specification is retained unchanged as historical requirements; the owner's E1-only scope supersedes its multi-experiment roadmap.
