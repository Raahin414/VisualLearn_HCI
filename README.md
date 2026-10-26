# VisualLearn

Five science courses—Water Cycle, Photosynthesis, Electric Circuits, Human Digestion and the Solar System—each presented at **low, medium and high** visual density. Within each course, text and quiz questions are identical across densities. E1 remains the only experimental factor: visual density. The original Water Cycle baseline/one-hour research workflow is retained separately.

The application is deployed to staging at https://visuallearn-staging.vercel.app. Changes in this checkout are not deployed automatically: deployment uses the CLI, not a Git integration. Real recruitment remains closed pending the reviews in [docs/REVIEW_PACKETS.md](docs/REVIEW_PACKETS.md).

## Presentations

| Condition | Visual material |
|---|---|
| Low | One essential whole-cycle diagram, canonical text and narration |
| Medium | Same essentials plus supportive callouts and two process illustrations |
| High | Same essentials plus four process illustrations, supportive/repeated labels and decorative details |

The canvas, audio, full explanation, core controls and tests are shared. All visual additions repeat material already taught. This is a density package, not a separate test of visual relevance. The draft manipulation requires educator review; no condition is assumed to work best.

## Learner and researcher flow

- **Five-course preview:** `/courses` lists all five lessons. Each course page previews the same text and four-question knowledge check at all three visual densities. Preview responses are not stored.
- **Recorded course:** after its own approval gate is opened, a student enters name and ERP, confirms adult status and consent, and receives one server-assigned density for the chosen course. PostgreSQL saves course, density, answers, score and timestamps; the authenticated researcher workspace shows name and ERP alongside them. Course answer keys stay server-only. A browser cookie allows resuming the current course attempt.
- **Student participation:** visible navigation -> `/study/enroll` -> consent/F0 -> baseline A -> persisted server assignment -> five-chapter lesson -> immediate B + F3 -> one-hour C + F5 -> finish. All stages run inside `/study/session`. An approved optional D/F6 path remains off by default.
- **Return:** the original browser or private fragment-based return link restores the saved session. One-hour timing starts at server-recorded lesson completion, not at survey submission.
- **Researcher:** `/admin` requires Supabase Auth, allowlisted UUID and TOTP MFA. It includes a restricted Student records tab plus the E1 dashboard, blind written-response ratings, de-identified exports and protected codebook. Names and ERP are excluded from exports.
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

Apply migrations with an authorized owner using `npm run db:migrate`. Migration **006** preserves the E1-only experiment scope. Migration **007** adds private E1 student identity storage. Migration **008** adds private five-course settings, identities and attempts, initially disabled. Previous migrations remain historical schema upgrades; do not edit applied migrations.

The revised presentation is `density-v6-e1-draft`, shared source `e1-v8-draft`. Canonical lesson, WAVs and A/B/C/D/P banks are unchanged. Existing frozen sessions are preserved but fail closed on incompatible hashes; do not rewrite their versions to make them resume.

Apply 007–008 before deploying this revision. The existing hosted database and Vercel project are not changed by local code edits. Set `COURSE_RECORDING_ENABLED=false` until approved consent, content, ethics and contact fields are configured in `visuallearn.course_study_settings`; the database also requires `enabled=true`. The read-only `npm run verify:staging` expects 001–008 after upgrade.

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
