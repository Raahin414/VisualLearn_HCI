# Implementation handoff — 2026-10-16

## M4 handoff — 2026-10-24 (verified locally)

Follows pushed/remote-verified Windows fix 9b5486a. Owner scope explicitly stops at M4: local-only completion, preserved E2/E3, response-based heuristics and a commit. No hosting or hosted project changes.

Implemented migration 005, distinct D/F6 with frozen optional version/hash/window and server-owned +7-day timing, staged written answers and blind-rating support, development-only draft debrief, descriptive dashboard charts with mixed-cohort suppression, transparent response-review-v1-draft rules and actual-answer preview, cohort-stratified Python plots/missingness/paired changes, and an inactive policy/flag-gated deletion operator. Deletion is atomic, handles linked rows and preserves only private aggregate allocation history. No retention delay or seven-day grace is configured for live use. Source advances to shared-v7-draft with the follow-up display added to the source manifest; original canonical/spec/audio and A/B/C/P question objects remain unchanged.

Executed: clean npm ci (420 packages, audit 0), verify-content, 75 unit/service tests/12 files (includes PGlite), dedicated 5-test PGlite command, lint/types, 18 real PostgreSQL cases, 30 dev browser tests (1.4 min), build/22 clean assets, 30 production browser tests (28.6 s), 21 pristine local security checks and 25 connected real local Auth/MFA/PostgreSQL tests (5.8 min). Python: 5 tests and actual de-identified export analysis on 37 SYNTHETIC fixture sessions in two frozen cohorts; no primary model. Production smoke: 200/404/404/401. Initial failed fixture/syntax/encoding/browser attempts are retained in QA. Fresh UI review returned ship; no design system replacement or manual scientific approval is implied.

Handoff: use npm run dev and /dev/study for credential-free local demonstration, including E2/E3, optional D/F6, draft debrief and heuristics generated from submitted browser answers. For real researcher database use, an authorized migration owner must apply 005 to that database first; only disposable local databases were migrated in this milestone. Populated env files, local database credentials, Auth tokens/QRs and raw fixture state remain ignored.

Not verified/approved: manual screen-reader/device testing, human scientific/instrument/rubric/rights/consent/retention/ethics reviews, hosted participant workflow, backups/restore or app hosting. Next three tasks, only under a later scope: (1) human review of D/debrief/response cutoffs/retention policy, (2) authorized migration and verification of any non-local database before using this revision there, (3) manual accessibility/device evaluation before a human pilot. Recruitment remains closed; E4-E8 remain disabled. Exact M4 commit and remote hash are obtained from Git after the final diff/secret review.

## Windows verifier repair and baseline — 2026-10-24

At c89243c, the resumed full baseline passed content/spec/audio checks, clean install (420 packages, audit 0), 62 unit/service tests, 5 dedicated PGlite checks, lint/types, 15 real PostgreSQL cases, 29 dev/29 production browser cases, build/22 clean assets and production HTTP 200/404/401. Connected setup initially aborted after its 19 security passes during forced Node shutdown. Owner authorized the fix and continued implementation. Replacing forced exit with `process.exitCode` preserved all checks and produced a complete 24/24 local connected pass in 5.6 min, including actual session expiry, invite/recovery, MFA, exports and E2/E3. No hosted changes. Next: M4.

## M3 handoff - 2026-10-24 (verified, recruitment closed)

Follows pushed/remote-verified M2 50ca2a5. Implemented E3 canonical groups [1,1,1,1,1], [3,2] and [5], exact word/media parity, fixed-rate single-active narration, unique SVG definition IDs, server-derived group progress, closed pilot/version/time-policy gates, migration 004, UUID-deduplicated exposure/visible-time proxies and versioned export columns. Shared source revision is separated from presentation contract versions without rewriting old rows. The controlled obsolete-load regression is preserved; its ref-cleanup lint warning is removed using a stable callback.

Executed: Node 24.22.1/npm 11.21.1 `npm ci` (414 packages, audit 0), `verify-content` (5 canonical segments, 327.0 seconds unchanged WAVs), `test` (62/10 files, includes PGlite), `db:validate` (5), lint/types (0 errors/warnings), native `test:pg` (15), development Chromium (29/29, 4.2 min), optimized build/bundle (22 clean assets), production Chromium (29/29, 1.5 min), pristine local security verifier (19/19), complete real local Supabase Auth/MFA/PostgreSQL Chromium (24/24, 7.2 min), production HTTP smoke (200/404/401). Focused E3 connected workflow also passed 1/1 (1.3 min). A missing import was caught/fixed before full verification; no incomplete run is counted as passing.

Nine initial E3 screenshot captures cover 360/768/1280 in docs/screenshots/m3/. Automated axe/keyboard/overflow and exact canonical paragraph traversal pass in every arm. Browser media tests prove fixed 1x and one active narration in multi-block groups. Representative mobile/tablet/desktop layouts were visually reviewed. Migration 004 upgrade retains old source/presentation versions and null measurement metadata; actual zero counters are not confused with uncollected legacy metrics. Source/canonical/audio/spec and targeted credential-pattern review are required before the commit. No approvals, real recruitment or hosted changes occurred. Next: M4.

## M2 handoff - 2026-10-24 (verified, recruitment closed)

Follows verified/pushed M1 `5882146`. Implemented centralized server modality projections, canonical four-arm renderer with recorded transcript accommodation and fixed 1x audio, closed pilot gates, additive migration 003, experiment-scoped summaries/exports, modality F3 N/A version and development-only simulator support. Canonical JSON/WAV/SVG/banks/rubrics and original specification remain unchanged.

Executed: Node 24.22.1/npm 11.21.1 clean `npm ci` (414 packages, audit 0), `verify-content` (5 segments, 327.0 seconds unchanged WAVs), `test` (57 across 9 files, includes PGlite), `db:validate` (5), lint (0 errors, 1 intentional cancellation-ref warning)/types, `test:pg` (14 real PostgreSQL), final development `test:e2e` (26/26, 3.2 min), build/bundle (22 assets), production Chromium (26/26, 1.4 min), production HTTP smoke (200/404/401), pristine local Supabase verifier (19/19), complete connected real Auth/MFA/PostgreSQL Chromium (23/23, 6.7 min). No hosted work or actual researcher acceptance was performed.

New evidence covers all 4 modalities at 3 widths, source/transcript equality, channel/rate contracts, keyboard accommodation, refresh, no research requests in the simulator, legacy schema preservation, 12 concurrent E2 allocations, duplicate telemetry/accommodation handling, one-hour C/F5 and withdrawal. Fixed a reused test-worker pool lifecycle and a real obsolete-load UI hazard; the latter is reproduced by controlled HTTP response ordering and a deliberate failing guard mutation. Final source was restored exactly, rehashed and fully verified. Historical M1 screenshots are preserved; current regression captures use `docs/screenshots/current/`, with E2 primary presentations in `m2/`. Initial fixture/locator errors and failed runs remain in QA; they are not counted as passes.

Next: commit/push this verified M2 checkpoint on the requested branch and verify its remote hash, then proceed directly to M3. No recruitment or review approvals were recorded.

## M1 handoff — 2026-10-24

Follows verified/pushed baseline `9b0d509`, branch `feat/visuallearn-foundation`. Implemented shared academic type/spacing/radius/focus tokens, readable metadata/control text, consistent form surfaces, keyboard-scrollable dashboard regions, simpler public copy and removal of decorative rotations/shadows/emoji. Fixed two real hydration defects: cached native audio metadata/error events could precede handlers and leave stale loading status; immediately after MFA, a tab button could be clicked before its callback existed. Shared buttons now wait for hydration (native links still work); replay/chapter controls use that primitive and chapter navigation waits for saved progress. No playback command or telemetry is emitted by readiness synchronization.

Frozen reviewed source hashes under `density-v4-draft`, adding layout/header/public player/button sources. Canonical JSON, objectives, question/written/survey wording, lesson SVG tiers and all five WAVs remain byte-identical to `9b0d509`. The original specification SHA-256 remains `4c4d7e957ce6149940aaeb7bae1ac12a4fbfd76222fa83f57b6c34fe408c12a5`. No migration/dependency/export/schema changes.

Executed: `npm ci` PASS (414 packages, audit 0); `verify-content` PASS; `test` PASS 51/8 files (includes PGlite); dedicated `db:validate` PASS 5; lint/types PASS; real PostgreSQL `test:pg` PASS 13; final development Chromium PASS 21/21 (4.5 min); build/bundle PASS (22 assets); production Chromium PASS 21/21 (2.6 min), smoke 200/404/401; local Supabase verifier PASS 19/19 and connected real Auth/MFA/PG Chromium PASS 22/22 (6.1 min). Controlled browser regressions deliver real media before application JS and simulate a 404 only at the media boundary; the existing participant HTTP-mock contract remains distinct from real connected tests. Failed/interrupted runs and fixes are recorded in QA, not counted as passes.

Reviewed screenshots at 360/768/1280: home, lesson variants, forms, anonymous auth/accept/simulator and authenticated SYNTHETIC dashboard. Stored before/after matrices under `docs/screenshots/`. No MFA setup key or QR captured in these artifacts. Axe includes WCAG 2.2 AA and requires zero violations; keyboard checks include skip links, assessment focus and dashboard horizontal scrolling. Other real devices/manual screen readers and every human scientific/ethics review remain unverified. No hosted changes performed.

Next: M2 modality (same canonical script/audio, recruitment closed), M3 chunking, then M4 research mechanisms/analysis. Continue autonomously per the latest user scope; never invent approvals or activate real recruitment. Exact M1 checkpoint/push is obtained from the Git log and remote verification.

## Windows baseline handoff — 2026-10-24

Latest user scope authorizes baseline fixes followed by M1–M6, separate verified/pushed milestones, with no recruitment or invented approvals. Onboarding read all tracked Markdown and the local Next.js CSS/client-boundary guides. Actual branch/origin baseline: `feat/visuallearn-foundation` at `9ecc795`; prompt-referenced newer hashes are absent. Preserved the existing launcher fix and generated screenshots.

Fixed installed CLI launching on Windows for staging, PostgreSQL, Supabase and the connected web server; env parsing now accepts CRLF and quotes and safely appends a new secret line. Disposable PostgreSQL port changed to 15439 after Windows refused 55439. Ephemeral database passwords are passed in the child environment, not command arguments. Browser suites retain assertions, use one worker/longer budgets and explicitly wait for route navigation. No application research logic, migrations, canonical content, item banks, SVG tiers or WAVs changed.

Executed with Node 24.22.1/npm 11.21.1 via isolated runner and Docker Desktop 29.6.2: `verify-content` PASS (5 segments, 327.0 s); `test` PASS 51/8 files; `db:validate` PASS 5 PGlite tests; lint/typecheck PASS; `test:pg` PASS 13 against real PostgreSQL 17; `test:e2e` PASS 16/16 (4.2 min); build and bundle scan PASS (22 assets); production smoke `/` 200, `/dev/study` 404, `/api/admin/stats` 401; `test:e2e:production` PASS 16/16 (1.3 min); local Supabase verifier PASS 19/19 and `test:connected` PASS 22/22 (4.6 min). Earlier failed setup/timing runs are detailed in QA and excluded from pass counts. Built-in env parser separately checked with CRLF/quoted fixture values. Original spec SHA-256 unchanged; syntax/whitespace checks pass.

Before screenshots retained in `docs/screenshots/m1-before/` (home/lesson/assessment plus anonymous researcher auth, accept and simulator at three widths). No authenticated QR/keys captured. Latest staging summaries reconciled with later recorded project configuration; no hosted changes or current hosted verification performed.

Next: M1 shared academic UI with versioned source hashes and unchanged canonical stimuli, then M2 modality and M3 chunking. Human approvals remain unresolved; app hosting and hosted participant/restore validation remain pending.

Repository: https://github.com/Raahin414/VisualLearn_HCI. Initial remote was empty. Working branch: `feat/visuallearn-foundation`. Baseline commit: none (unborn repository); this run creates the first local checkpoint. Use `git log -1` for its exact commit; no GitHub push or deployment is implied.

> Historical foundation record below. The **current local-stabilization session** follows baseline `9562e94` and is recorded at the end of this document. Current status is in root `PROGRESS.md`; the previous staging-first recommendation is deferred by the latest user scope.

## Completed engineering

- Read the full 35-section v2 specification and pasted implementation brief; inspect empty repository; preserve the original specification at `VISUALLEARN_AGENT_IMPLEMENTATION_SPEC.md` (byte-for-byte hash checked).
- Initialize Next.js 16 / React 19 / strict TypeScript / Tailwind with reusable Radix/CVA controls, original cream/teal visual identity, responsive public routes, safe closed research/admin states, error recovery, metadata, security headers and CI.
- Build catalog, course detail, five-segment Water Cycle demo, original tiered SVG illustration, real 327-second fixed development narration, transcripts, keyboard controls, local refresh recovery, reset and distinct server-scored practice bank P.
- Implement server-only A/B/C draft banks (8 MCQs each), F0 validation, F3/F5 questionnaire schemas/UI, free recall capture and draft rubric. No answer keys/rationales serialized to learners, and no research score feedback before debrief.
- Implement PostgreSQL private-schema migration, RLS and backend-role policies, eight disabled experiment seeds, transactional age-stratified allocation, idempotent attempts/surveys, server lesson timestamps and one-hour follow-up schedule, per-session content/media/question/stimulus hashes and frozen follow-up grace.
- Implement same-origin participant API, signed HttpOnly session cookies, request validation/body limits/rate limits, participant state enforcement, secure hashed return secrets using URL fragments, withdrawal, bounded per-participant retry queue and deduplicated telemetry ingestion.
- Implement conditional approved-consent enrollment UI and research participant screens covering pretest, fixed-condition lesson, immediate assessment/F3, waiting/return, Form C/F5, completion and withdrawal. Minor enrollment always blocked pending a real guardian verification mechanism.
- Implement Supabase-verified admin sign-in, UUID allowlist, server aggregates, nine audited CSV exports, consistent de-identified join keys, withdrawal exclusion and formula-safe CSV. Empty dashboards do not invent results.
- Add actual standalone SVG files, frozen media/source manifest, viewport screenshots, source/licensing register, data dictionary, deployment/privacy/protocol/decision docs, Python analysis scaffold and unfilled results template.

## Verification

`npm run verify-content`: PASS (5 segments, 327.0s WAVs, hashes).

`npm run test`: PASS (29 tests / 5 files); `npm run db:validate`: PASS (5 database-specific tests).

`npm run lint` and `npm run typecheck`: PASS (no errors/warnings).

`npm run test:e2e -- --reporter=line`: PASS (9 tests, final full run 28.6s). Public navigation/demo/score, no research writes, closed gates, key leakage, 360/768/1280px overflow/axe/keyboard/screenshot checks; separate SYNTHETIC participant UI contract through F5. Database service tests independently exercise real PostgreSQL semantics in PGlite. Neither substitutes for hosted Supabase browser testing.

`npm audit --omit=dev --json`: zero production advisories. Full development audit: 5 known transitive lint/glob advisories, documented in DEPLOYMENT/QA. Python AST syntax parse: PASS. No real analysis outputs exist.

`npm run build`: PASS: optimized production compilation, strict TypeScript and generation of all 16 listed routes. `npm start` with the supplied local environment example: PASS. Final full Playwright suite against the production server: **9 passed in 18.0s**. `npm run typecheck` now runs `next typegen` before TypeScript for fresh-checkout reliability.

See [QA.md](QA.md) for limitations and initial failures that were corrected.

## Blockers and incomplete acceptance criteria

- Supabase project/connection/auth configuration not supplied. Hosted migration, dedicated non-owner runtime grants, real admin login, multi-client concurrency, connected E1 browser lifecycle and actual hosted exports remain unverified. No production database or participants have been created.
- Protocol, ethics, approved consent wording/contact, educator/instrument validation, primary endpoint/sample planning, final +60m window, device/accommodation policy, retention/deletion and narration distribution rights are unresolved. All registry entries are draft; no live enrollment is authorized. Development audio must be approved/replaced before publication as study material.
- Current research forms have eight objective MCQs plus recall. Richer ordering/labeling items, separately rated scenario responses, finalized equalized forms, blind-rater/adjudication UI, optional D seven-day path, approved debrief and full researcher charts remain incomplete.
- Telemetry records navigation/audio/visibility/submission events but needs full active-time/scroll/poor-network/device validation. Accommodations/device fields need a finalized, measured UI and export schema. Queue caps/abrupt termination can lose events; behavior is not attention.
- Exports are implemented and SQL-tested; machine-readable codebook export, expanded item-level rows, complete analytics/CI hosted run and approved analysis model require further implementation/validation.
- E2–E8 definitions are present; renderer strategies beyond E1 and E2/E3 pilots are not implemented. E4–E8 remain intentionally disabled.
- No deployment, GitHub push, human research collection, study results or claims of scientific validity.

## Next three tasks

1. Connect an authorized **staging** Supabase PostgreSQL/Auth project, execute the migration with a migration role, provision a non-owner runtime login in `visuallearn_backend`, and verify anonymous/public access is denied. Keep recruitment disabled.
2. Run the connected E1 flow with clearly SYNTHETIC sessions, including two concurrent clients, refresh/recovery, duplicate submissions, +60m/expired eligibility, real administrator sign-in and every export. Add any failures as regression tests before proceeding.
3. Obtain supervisor/educator decisions and narration rights; finalize/version instruments, ordering/scenario tasks, blind scoring, debrief, telemetry/accommodations and codebook. Re-run the full acceptance matrix before any human recruitment. Only then consider E2/E3.

## Session 2 — local stabilization after 9562e94 (2026-10-16)

User scope: improve the existing local MVP, finish one bounded milestone, document and push `feat/visuallearn-foundation`. No Supabase integration, deployment, real studies, new subjects or E2–E8 implementation.

Audit: clean working tree on expected branch/baseline. Remote was empty and `git push --dry-run origin feat/visuallearn-foundation` succeeded. Docker CLI exists but `docker info` failed because the Docker Desktop Linux engine pipe was unavailable; no provisioning or database fallback was attempted. Full original spec reviewed and remains unchanged.

Completed: shared narration feedback/cleanup; normalized chapter visits, study progress and next preview; shared assessment progress/validation/focus/tab drafts/retry guards; server whitespace recall rejection; browser-storage denial handling; injected SYNTHETIC browser-only study transport, full development walkthrough and checkpoint preview, +60m/expiry controls, server production-404 boundary. Canonical copy/diagrams/questions/audio are unchanged; draft shell version is `density-v2-draft`, with expanded UI source hashes. No dependencies or migrations changed.

Changed areas: `components/{learning,assessments,study,demo}`, `lib/{assessments,content,demo}`, `lib/browser-storage.ts`, narrow validation/version updates in `lib/study/service.ts`, `/dev/study`, common CSS, content hash manifest, new unit/browser tests and screenshots. Required README/PROGRESS/ROADMAP/AGENTS/DECISIONS docs updated; build/local DB files remain ignored.

Executed:

- `npm run verify-content`: PASS, unchanged 5-segment copy and 327.0s fixed WAVs; expanded shared UI hashes verified.
- `npm run test`: PASS, 35 tests / 6 files; `npm run db:validate`: PASS, 5 database-specific tests.
- `npm run lint`, `npm run typecheck`: PASS, no errors/warnings.
- `npm run test:e2e -- --reporter=line`: PASS, 13 development-server tests in 29.6s. New real browser simulation has no HTTP mocks and sends no research requests; original independent HTTP contract fixture remains separately labeled.
- Original spec SHA-256 unchanged: `4c4d7e957ce6149940aaeb7bae1ac12a4fbfd76222fa83f57b6c34fe408c12a5`. `git diff --check`: PASS.
- `npm run build`: PASS, optimized build and route generation. `npm run test:e2e:production -- --reporter=line`: PASS, 13 tests in 17.6s, including strict production 404 for `/dev/study`. CI now runs this suite after building.
- Final source review: no dependencies/migration changes; unchanged canonical copy, full question bank and WAV bytes checked against `9562e94`; credential-signature scan and ignored-file checks passed. Desktop simulation/mobile assessment screenshots reviewed.
- Checkpoint/push target: existing `feat/visuallearn-foundation` on `origin` (no force). Exact checkpoint is obtained from Git history; remote confirmation is provided in the final handoff after the actual push. No hosted CI success or deployment is assumed.

Remaining: questionnaire draft recovery, richer item types/scenario scoring, blind-rater UI, codebook/analytics, local PostgreSQL races and complete scientific review. The simulation is not proof of persistence/authentication/grading, and tab drafts are not server autosave. No real records/results or approvals were invented.

Next 3 tasks: (1) mixed assessment interactions and questionnaire draft recovery, (2) local PostgreSQL concurrency when Docker is available, (3) local researcher codebook/item exports and blind scoring. Supabase/deployment need a later scoped milestone. Stop after this session's push and handoff.

## Session 3 — E1 foundation after c812d73 (2026-10-18)

User scope: nine ordered tasks — finish assessments, verify PostgreSQL, Supabase staging, security, connected study, researcher tools, external reviews, hosting, then test/document/push. Prioritise a reliable E1; no new experiments or courses.

Audit: clean tree on `feat/visuallearn-foundation` at `c812d73`; spec hash unchanged. Docker engine now available (29.8.0). Node 24.22.0 installed via nvm for this repo. No Supabase CLI login, no hosted project, Vercel token invalid: hosted staging and hosting could not be created and nothing was published or deployed.

Completed (files): assessment v2 (`lib/assessments/{questions.server,rubrics.server,written-prompts,draft,survey-draft,surveys}.ts`, `components/assessments/*`, `components/surveys/survey-form.tsx`, `components/study/study-runner.tsx`); migration `002`, private ledger (`scripts/migrate.mjs`), runtime role (`supabase/roles/runtime_role.sql`), local Supabase config; MFA researcher auth (`lib/security/admin*.ts`, `app/api/admin/*`); dashboard, rating, codebook, exports (`lib/admin/*`, `components/admin/*`); harnesses and auditor (`scripts/{pg-harness,supabase-harness,verify-staging,check-client-bundle}.mjs`); tests (`tests/assessment-v2.test.ts`, `tests/postgres`, `tests/connected`, e2e updates); CI; docs including `REVIEW_PACKETS.md` and the staging/hosting runbook.

Executed: see [QA](QA.md) — all suites pass (48 unit, 5 PGlite, 13 PostgreSQL, 15 dev + 15 production browser, bundle scan, 19/19 verifier, 16/16 connected). Real defects fixed are listed in QA and DECISIONS.

Blockers: hosted Supabase/hosting need the owner's account; every external review and approval in `REVIEW_PACKETS.md` is outstanding; minors blocked.

Next 3 tasks: (1) owner creates the staging project and runs DEPLOYMENT §2 with `npm run verify:staging`; (2) educator/supervisor reviews, then version the banks if changed; (3) choose a host, deploy staging, repeat the SYNTHETIC workflow and a backup-restore drill. Recruitment stays closed.

## Staging researcher invitations — 2026-10-22

User scope: resend the expired Rameez invitation and send Tajuddin an invitation. Branch `feat/visuallearn-foundation`, HEAD `9ecc795`; no commit or push requested.

Used the saved Supabase CLI session for the existing staging project. Targeted Auth admin lookup confirmed Rameez's account was unconfirmed and Tajuddin had no account. Both POST `/auth/v1/invite` requests returned HTTP 200: Rameez at 14:03:00 UTC and Tajuddin at 14:03:03 UTC. This confirms Supabase accepted the sends; inbox delivery and recipient acceptance are not verified. Redirect remains `http://127.0.0.1:3000/admin/accept`.

Added Tajuddin's returned UUID to `ADMIN_ALLOWLIST` in the ignored `.env.staging.local` and `.env.staging.rameez.local`; no credentials or invite tokens were printed or committed. Both files remain ignored. Original specification SHA-256 remains `4c4d7e957ce6149940aaeb7bae1ac12a4fbfd76222fa83f57b6c34fe408c12a5`. No application code changed; application suites were not rerun.

Next: (1) recipients run `npm run dev:staging` with their authorized local configuration before opening their new emails, (2) complete password and TOTP setup, (3) verify researcher access after acceptance. Rameez's existing configuration copy needs the updated allowlist if Tajuddin will use that local app. Hosting and research approvals remain outstanding; recruitment stays closed.

## Raahin's separate staging configuration — 2026-10-22

User requested a separate env file. Created `visuallearn_dev_raahin` with only `visuallearn_backend` membership, the existing 15-second statement and 30-second idle-transaction limits, and a 30-day login expiry (2026-11-21 14:13:53 UTC). Created ignored `.env.staging.raahin.local` with mode 600 and exactly the five app settings used by Rameez's setup; the database password and session secret are unique. No owner connection or service-role key is included.

Executed the existing `scripts/verify-staging.mjs` against hosted PostgreSQL/Supabase with Raahin's runtime URL: **19/19 PASS**, including non-owner privileges, denied DDL/auth-user access, private schemas, closed enrollment and all three allowlisted Auth UUIDs. No app code, stimuli, research records, commits or pushes changed. Handoff: privately give him the file, save it as `.env.staging.local` in his checkout, then `npm ci` and `npm run dev:staging` before accepting the invite. Next: deliver configuration privately, complete password/TOTP setup, verify his researcher sign-in. Research approvals and hosting remain outstanding.

## Invitations resent; Taj's new email — 2026-10-23

User scope: resend staging invites to Rameez and Taj, with Taj's new address raahinmawani@gmail.com. The service-role key was read by the owner's own shell (`supabase projects api-keys`) and never printed. Both POST `/auth/v1/invite` requests returned HTTP 200 at 18:56 UTC: Rameez's existing account `18404643-…`; a new account for Taj, `611eb745-399e-4421-8b49-9f383d8d900c`. Redirect remains `http://127.0.0.1:3000/admin/accept`. Delivery and acceptance are not verified.

The owner replaced Taj's old, never-accepted UUID `aa42a500-…` (tajuddinraahin@gmail.com) with the new UUID in `ADMIN_ALLOWLIST` in all three ignored staging env files (own, Rameez's, Raahin's). The old Auth user still exists in staging and is no longer allowlisted. No app code, stimuli or research records changed; suites were not rerun.

Next: send the updated env files privately; recipients restart `npm run dev:staging`, then accept the invite and enroll TOTP. Optionally delete the old Auth user.

## Hosted staging migrated to 005 — 2026-10-24

User scope: pull the M1–M4 commits, migrate hosted staging, pin Node 24 and push. Rebased the two local docs commits onto origin `51093e1` without conflicts. Re-ran locally on Linux with Node 24.22.0/npm 11.19.1: verify-content, 75/75 unit/service tests (12 files, includes PGlite), 5 PGlite schema tests, lint, typecheck, build, bundle scan (22 clean assets), `test:pg` 18/18 on real PostgreSQL 17. Browser and connected suites were not re-run here. With Node 22, 5 unit files fail; added `.nvmrc` (24).

Ran `scripts/migrate.mjs` with the owner connection from the ignored `.env.staging.local` against hosted `visuallearn-staging`: "Applied migrations 003, 004, 005 and draft-only seed. Recruitment remains disabled." (one transaction). Then `npm run verify:staging` against hosted staging: **21/21 PASS**, including ledger 001–005, E2–E8 disabled, optional seven-day recruitment disabled, physical-deletion gates inactive, 0 participants, 3/3 allowlisted researcher UUIDs, non-owner runtime login. No participant data, Auth settings or roles changed. Hosting, hosted SYNTHETIC run and restore drill remain pending.

## M5 hosting started — 2026-10-24

User scope: host the app (M5). Chose Vercel, team `trs20` (Hobby), project `visuallearn-staging`, region `bom1` to sit beside the ap-south-1 database. Added `vercel.json`, `.vercelignore` and `engines.node=24.x`; `vercel link` added `.vercel` to `.gitignore` (the GitHub repository could not be connected from this account, so deployments are CLI uploads). The owner set eight production variables with a script that printed names and OK/FAIL only (runtime login asserted, new 32-byte session secret, sensitive storage for credentials, no service-role key). `vercel deploy --prod` built and aliased https://visuallearn-staging.vercel.app.

Live checks: `/` 200, `/demo/water-cycle` 200, `/admin` 200, `/admin/accept` 200, `/dev/study` 404, `/api/admin/stats` 401 (`UNAUTHORIZED`), cross-origin `POST /api/admin/recover` 403; responses served from `bom1` with HSTS and `X-Frame-Options: DENY`; the per-deployment URL redirects to Vercel Authentication. Six malformed same-origin recover requests returned 400×5 then 429, proving the hosted runtime login reads and writes the rate-limit table without contacting Supabase Auth (five rate-limit rows were left in staging). The owner ran `supabase config push --workdir staging`: only `auth.site_url` and `auth.additional_redirect_urls` changed ("2 properties pushed"); the local redirect is kept while dev logins exist. The push reported database SSL enforcement disabled.

Not yet done: custom SMTP, researcher sign-in on the hosted URL, hosted SYNTHETIC participant workflow, backup-restore drill, dev-login revocation, SSL enforcement. Recruitment remains closed.

## M5 hardening — 2026-10-24

Owner confirmed Rameez and Taj had already completed researcher sign-in and TOTP enrollment, so the hosted URL needs no new links. Confirmed every staging connection string uses `sslmode=require` (checked without printing values). With the owner connection: `alter role visuallearn_dev_rameez nologin`, `alter role visuallearn_dev_raahin nologin`; afterwards only `visuallearn_app` can log in and no dev sessions were open. Updated `staging/supabase/config.toml` (only the hosted `/admin/accept` redirect; `[db.ssl_enforcement] enabled = true`); the owner's `supabase config push` reported exactly those two changes. Re-checked: hosted `/` 200, `/dev/study` 404, `/api/admin/stats` 401, database-backed rate limit 400×5 then 429; `npm run verify:staging` 21/21 PASS. Local `npm run dev:staging` with the revoked logins no longer works by design; use `npm run dev` and `/dev/study` for local work. Remaining: custom SMTP, hosted SYNTHETIC workflow, backup-restore drill.
