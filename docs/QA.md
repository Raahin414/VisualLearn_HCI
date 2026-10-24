# Verification record — 2026-10-18

## M1 academic interface — 2026-10-24

Node 24.22.1/npm 11.21.1, Docker 29.6.2. `npm ci` PASS: 414 packages installed, 0 audit findings. No dependency versions changed.

| Check | Actual result |
|---|---|
| Content/spec integrity | PASS: original specification, all WAVs, lesson JSON, objectives, item banks and lesson SVG unchanged; reviewed shared sources frozen as `density-v4-draft` |
| Unit/service | PASS: 51 tests/8 files, including PGlite-backed tests |
| Dedicated schema command | PASS: 5 PGlite tests (also included in the full test command) |
| Lint/typecheck | PASS; production build also typechecks the added browser tests |
| Real PostgreSQL 17 | PASS: 13 tests against the final shared audio/status sources |
| Development Chromium | PASS: 21/21 (4.5 min), including the final shared button hydration fix; real demo/practice and browser-only SYNTHETIC simulation; existing participant HTTP-mock contract remains separately labeled |
| Audio regressions | PASS: real media before delayed application JS reports ready; a mocked 404 media response leaves the real transcript available and disables replay |
| Production build/bundle | PASS: 22 browser assets clean |
| Production Chromium/smoke | PASS: 21/21 (2.6 min); `/` 200, `/dev/study` 404, `/api/admin/stats` 401 |
| Local Supabase connected workflow | PASS: 22/22 (6.1 min), real Auth/MFA and PostgreSQL, no HTTP mocks; verifier 19/19; includes signed-in dashboard axe/keyboard checks and screenshots at 360/768/1280 |

WCAG 2.2 AA tags added to existing public/assessment tests and new form/simulator three-width checks; all executed axe checks require zero violations. Keyboard checks include skip navigation, quiz error focus and the connected dashboard's horizontal table scrolling. Before images: `docs/screenshots/m1-before/`; after images: `docs/screenshots/m1-after/` plus the refreshed root screenshot matrix. No MFA setup key/QR is captured in these design artifacts. Manual screen-reader/real-device validation remains open.

Visual-review corrections: preserve chapter number widths in the mobile scroll row. New narration assertion first failed with metadata already loaded but "Loading narration…" persisting for 15 seconds; a mount-time native-state synchronization fixed the missed pre-hydration event. The earlier 19-test development pass predates this added assertion. A verification pipeline was intentionally stopped after build/bundle, before production tests, to fix that newly reproduced status bug. A subsequent connected run had 19 passes, one lost-click failure after MFA reload and two dependent skips; the UI remained on the overview for 180 seconds. The shared button primitive now disables callback/form buttons until hydration; native links remain functional. The final 21/21 dev, 21/21 production and 22/22 connected passes include this fix. The anonymous screenshot helper initially timed out on network-idle during development; it was corrected to wait for actual control readiness, then captured all three widths.

## Windows baseline — 2026-10-24

Node 24.22.1/npm 11.21.1 via an isolated npm runner; Docker Desktop 29.6.2. System defaults remain Node 22/npm 10. No hosted project used.

| Check | Actual result |
|---|---|
| Content and original specification | PASS: 5 segments, 327.0 seconds of unchanged WAVs; original spec SHA-256 matches `4c4d7e95…a5` |
| Unit/service and schema | PASS: 51 tests/8 files; separately 5 PGlite schema tests |
| Lint/typecheck | PASS, including infrastructure fixes |
| Real PostgreSQL 17 | PASS: 13 tests, non-owner runtime role, disposable local database on port 15439 |
| Development Chromium | PASS: 16/16 with one worker; includes isolated browser simulator and separately labeled HTTP-mock contract |
| Production build/bundle | PASS: 22 browser assets contain no research keys/rubrics/secret names |
| Production Chromium | PASS: 16/16; smoke `/` 200, `/dev/study` 404, `/api/admin/stats` 401 |
| Local Supabase | Security verifier PASS 19/19; connected Chromium PASS 22/22 (4.6 min), real Auth/MFA/invites/recovery/exports; no HTTP mocks |

Failed runs, not counted as passes: original navigation heading assertion timed out after a cold route click (isolated rerun passed); a two-worker full run had 12 passes/4 timeouts in practice/simulator/axe; PostgreSQL initially failed on Windows-reserved port 55439; direct `npx` spawning was not portable, and the first direct Vitest subpath was not exported; nested `npx next` failed in the connected web-server configuration. The port, CLI launchers, explicit navigation waits and single-worker timing configuration address these distinct failures. Functional assertions remain intact. Generated Windows screenshots are retained; M1 before evidence is captured separately.

## Follow-up: hosted staging and researcher invitations

| Executed check | Kind | Result |
|---|---|---|
| `npm run verify:staging` on `visuallearn-staging` | **Hosted Supabase**, read-only | PASS 19/19 after migration, runtime login, Auth push and redirect update |
| `npm run test:connected` | Local Supabase Auth + PostgreSQL | PASS: original 16/16 unchanged; new `3-invite.spec.ts` 6/6 (run separately after a test-helper fix) |
| `npm run test:e2e`, `npm run test:e2e:production` | Browser | PASS 16/16 each (adds accept-page axe/overflow check) |
| lint, typecheck, `npm run test`, build, `check:bundle` | Static/unit/build | PASS; 48 unit tests; 22 learner assets clean |

**QR code fix (2026-10-19, reported by the project owner):** Supabase Auth returns the TOTP QR as raw SVG markup (~360 KB), which the page placed directly in `<img src>`, so it showed as a broken image. The earlier test only checked visibility. Now the server re-encodes it as a base64 SVG data URL (`lib/security/qr-image.ts`, 3 unit tests), the image gets a white quiet zone, and the connected test asserts the image decodes. Full connected suite: 22/22 in one run (isolated copy on port 3100, because the owner's `dev:staging` server occupied port 3000). Development and production browser suites were not rerun for this admin-only change for the same reason; stimulus hashes are unchanged.

Not verified: a researcher accepting a real emailed invite on staging, any SYNTHETIC participant run against hosted staging, backups/restore, hosting.


## E1 foundation milestone after c812d73

Executed on Linux, Node 24.22.0 / npm 11.19.1, Docker 29.8.0. All participants and researcher accounts were SYNTHETIC. No hosted service was used.

| Executed check | Kind | Result |
|---|---|---|
| `npm run verify-content` | Static | PASS: 5 segments, 327.0 s WAVs; lesson JSON and WAV hashes unchanged; manifest re-frozen for 4 changed and 4 new assessment/UI sources (`density-v3-draft`) |
| `npm run lint`, `npm run typecheck` | Static | PASS, no errors or warnings |
| `npm run test` | Unit (incl. PGlite service lifecycle) | PASS: 48 tests / 7 files |
| `npm run db:validate` | PGlite schema | PASS: 5 tests |
| `npm run test:pg` | **Real PostgreSQL 17** (Docker, loopback, tmpfs), app transaction code, non-owner login | PASS: 13 tests. Mutation check: replacing the allocation advisory lock with a sleep made 30 concurrent allocations `[10, 13, 9]` and the test failed; restored lock gives `11/11/10` |
| `npm run test:e2e` | Browser, development server; simulator has no HTTP mocks, `study.spec` is a labeled HTTP-mock contract | PASS: 15 tests (25.9 s) incl. axe/keyboard/overflow for ordering and labeling at 360/1280 px |
| `npm run build`, `npm run check:bundle` | Production build, asset scan | PASS; 21 learner assets contain the assessment UI and none of the keys, rationales, rubric anchors or secret names (keys present only in server chunks) |
| `npm run test:e2e:production` | Browser, production server | PASS: 15 tests (15.1 s), strict 404 for `/dev/study` |
| `npm start` smoke | Production server | Public routes 200, `/dev/study` 404, `/api/admin/stats` 401, enrollment 503 NOT_CONFIGURED |
| `verify-staging.mjs` on pristine local Supabase | **Real Supabase stack** (Postgres 17.11, GoTrue, PostgREST, Kong) | PASS: 19/19 (private ledger, RLS, no API-role grants, E2–E8 disabled, enrollment closed, runtime login non-owner/no DDL/no auth.users, REST refuses schema, sign-up and anonymous sign-in disabled) |
| `npm run test:connected` | **Real app + local Supabase Auth + PostgreSQL**, two browsers, no mocks | PASS: 16/16 (2.4 min), no server errors logged. Time advanced only by shifting SYNTHETIC rows in the local DB |
| Spec / whitespace / secrets | Review | Spec SHA-256 unchanged (`4c4d7e95…a5`); `git diff --check` clean; local credentials only in ignored `.local/` and `.env.local` |

Failures found during this run and fixed (not counted as passes): anon could insert into `public.visuallearn_migrations` on Supabase; return-link recovery race; runtime-role script rejected by Supabase's non-superuser `postgres`; `[auth.email] enable_signup=false` disabled password sign-in; client disconnects logged as 500; several test-helper races. An HS256 token-expiry check silently skipped because local Auth signs ES256; it was replaced by a real-expiry test rather than reported as passing.

Not verified: hosted Supabase project and Auth, hosting/HTTPS, backups and restore, Firefox/Safari/real mobile devices, manual screen-reader audit, human usability, psychometric equivalence and rubric reliability, the Python analysis script on exported data.

## Local stabilization milestone after 9562e94 (2026-10-16)

| Executed check | Result |
|---|---|
| `npm run test` | PASS: 35 tests / 6 files |
| `npm run db:validate` | PASS: 5 migration/seed/RLS/assignment tests; no schema changes |
| `npm run lint`, `npm run typecheck` | PASS: no errors/warnings; fresh route type generation included |
| `npm run verify-content` | PASS: expanded shared UI source manifest; canonical copy, bank and all 327.0s of WAVs unchanged |
| `npm run test:e2e -- --reporter=line` on dev | PASS: 13 tests in 29.6s, including browser-only simulation without HTTP mocks |
| `npm run build` | PASS: optimized build, TypeScript and route generation |
| `npm run test:e2e:production -- --reporter=line` | PASS: 13 tests in 17.6s; strict production 404 for `/dev/study` |
| Draft behavior | PASS: refresh restore, failed submission retained, retry success clears, missing-answer focus, whitespace recall rejection, blocked browser storage |
| Synthetic walkthrough | PASS: baseline → fixed-condition lesson → immediate/recall → F3 → locked/+60m C → F5, no research API requests; separate unit test verifies expiry |
| Visual/accessibility | PASS: existing 360/768/1280px checks; development empty-state mobile axe/overflow; reviewed desktop simulation and mobile assessment screenshots |
| Diff/integrity review | PASS: `git diff --check`, credential-signature scan, ignored environment/build/database files, original-spec SHA-256 and unchanged canonical/bank/WAV bytes |

CI now runs the production suite after building, so exposing the development simulator in production fails a test. No dependencies were added. Docker engine was unavailable; no PostgreSQL server/Supabase integration, deployment, human research or hosted CI run is claimed. Questionnaire drafts and broader scientific/security validation remain incomplete. Native audio controls remain browser-dependent. Source review and synthetic simulations do not establish research validity.

## Foundation verification (historical checkpoint 9562e94)

Executed locally on Windows, Node 24.14.1 / npm 11.11.0. See package-lock for resolved library versions. No hosted credentials or real participants were used.

| Command / check | Confirmed result |
|---|---|
| `npm run verify-content` | PASS: 5 canonical segments, valid frozen audio bytes, 327.0 seconds, renderer/style/survey source hashes |
| `npm run lint` | PASS: no errors or warnings after fixes |
| `npm run typecheck` | PASS: strict TypeScript |
| `npm run test` | PASS: 29 tests across 5 files |
| `npm run db:validate` | PASS: 5 migration/seed/RLS/assignment tests using disposable PGlite |
| `npm run test:e2e -- --reporter=line` | PASS: 9 Chromium scenarios, 28.6 seconds in final full run |
| Production `npm start` + full Playwright suite | PASS: 9 scenarios in 18.0 seconds against the optimized build |
| Axe automated checks | PASS: no WCAG 2 A/AA/2.1 AA violations found on eight public/demo/gated pages at 360/768/1280px; F3 contract UI also checked |
| Responsive / keyboard | PASS: no horizontal overflow on tested routes; skip link focus verified; actual screenshots reviewed at mobile and desktop widths |
| Demo audio / refresh | PASS: real audio metadata duration >30s, matching sources across density, chapter and density restored on refresh |
| Demo isolation | PASS: full lesson/practice scenario makes no research API requests |
| Research service lifecycle | PASS: synthetic consent gate, minor block, idempotent enrollment/assessments, fixed assignment, all-chapter completion, server follow-up, F3/F5, token recovery, telemetry dedupe, withdrawal |
| Delayed eligibility | PASS: fake clock boundaries at +30m, exactly +60m, +90m, and immediately after expiry; service blocks early Form C access |
| Exports | PASS: CSV escaping/formula neutralization, stable replacement IDs, all 9 export SQL queries execute and exclude withdrawn synthetic participant |
| `npm audit --omit=dev --json` | PASS: zero known production dependency advisories at check time |
| Python analysis scaffold | PASS: Python AST syntax parse. Actual study analysis not run (no observed data) |
| Source specification copy | PASS: original and repository Markdown SHA-256 match: `4c4d7e957ce6149940aaeb7bae1ac12a4fbfd76222fa83f57b6c34fe408c12a5` |

`npm run build`: PASS: optimized production build, TypeScript and route generation. `typecheck` generates Next route types first so it also works on a fresh checkout.

Failures discovered and fixed during this run: public-origin mismatch rejected valid practice POSTs; small-text contrast failures; mobile lesson grid overflow; test fixture Storage interface typing; overly broad Playwright selectors. None of these initial failed checks are counted as passing runs. A separate P practice bank prevents public scoring from being an oracle for research A/B/C keys. The final browser test includes an explicitly SYNTHETIC participant UI contract; it mocks HTTP responses and is **not** proof of a connected Supabase browser workflow.

Not verified: actual Supabase migration/grants, multi-connection PostgreSQL allocation races, real admin authentication/MFA, connected study browsers and exports, full screen-reader/manual accessibility audit, every segment/density screenshot combination, actual offline abrupt-process delivery, approved asset rights, scientific/instrument validity or human outcomes. Development lint dependencies have 5 transitive high advisory findings; no compatible patched braces release was available during the run. CI workflow was created but has not run on GitHub.


## M2 modality - 2026-10-24 (verified; failed attempts retained below)

Executed on Windows with Node 24.22.1/npm 11.21.1. Initial static/unit run exposed missing application of migration 003 in the PGlite fixtures (7 lifecycle failures); the fixtures now apply the complete schema. A new renderer test initially counted the Replay icon as a lesson diagram; it now identifies the accessible instructional SVG. New browser tests initially used an exact nested-select label locator; trace inspection confirmed the presentation was present and the locator was wrong. Those partial runs were stopped and corrected; they are not counted as passing suites. Simulator selects also wait for model initialization as a pre-hydration safeguard.

Completed so far: 57 unit/service tests across 9 files (including PGlite, not a hosted database); lint/typecheck; 14 real PostgreSQL 17 tests including 12 concurrent E2 allocations over independent runtime connections; 25 development Chromium tests (3.8 minutes), including all four E2 arms at 360/768/1280, WCAG 2.2 AA axe/overflow, canonical rendered paragraph equality, explicit transcript accommodation, refresh and no research requests from the simulator. No canonical lesson, SVG meaning, question/rubric or WAV bytes changed. Spec hash remains the required original. Clean-install/production/connected results will be recorded after completion.

The clean reinstall completed with 414 packages and zero audit findings; source/audio verifier passed (5 segments, 327.0 seconds), followed by 57 tests and the dedicated 5-test PGlite schema suite. An initial post-install lint process read a connected test during a concurrent write and reported a temporary parse failure. Prettier successfully parsed the final file, code edits were finished, and the pipeline was restarted with stable source files. This interrupted attempt is not counted as a passing verification.


Stable-code post-install run: content verifier, 57 unit/service tests, 5 PGlite schema tests, lint/typecheck, 14 real PostgreSQL tests, optimized production build, bundle scan (22 assets), production Chromium (25/25, 1.4 min) and pristine local Supabase security verifier (19/19) passed. The first expanded connected suite finished 22/23 (5.7 min): all existing cases passed, while E2 stopped before its first database operation because the previous researcher's test file closed the shared pool. The shared fixture now lazily creates a new local pool after end(), and the E2 file closes its own lifecycle. Targeted E2 and complete connected reruns are pending; this failure is not counted as a pass.

Historical M1 screenshots were restored to their committed versions after detecting that recurring tests reused that directory. Current regression captures now use `docs/screenshots/current/`; E2 initial presentations use `docs/screenshots/m2/`. No MFA setup key or QR is captured by these screenshot calls.


The focused real-connected E2 case passed (1/1, 1.2 min) after the pool fix. A subsequent complete run exposed an intermittent baseline UI-load race: the first concurrent enrollment case reached submit with zero answered items, and its dependent E1/dashboard fixtures consequently failed or skipped (10 passed, 2 failed, 11 not run, 4.1 min). The answer helper previously used a non-retrying question count and could silently do nothing during a transient form replacement. The helper now requires all eight cards and all eight answers, and StudyRunner commits only the newest complete load, discarding obsolete initial responses. A controlled HTTP-contract regression holds an old initial session response until a newer lesson is visible. Final real-connected and regression reruns remain pending. No timing gate or authentication checks were relaxed.


Controlled regression evidence: `session-loading.spec.ts` holds an obsolete initial session response until a newer assigned lesson is visible. The fixed loader passed (1/1, 16.0 seconds). A deliberate local mutation disabled only the obsolete-load guard: the same test failed because the late baseline response replaced the current chapter. The ignored harness restored the exact source bytes in finally; `verify-content` then passed. This expected failing mutation is regression evidence, not a passing application suite. The stable-source pipeline is being rerun, including all affected browser paths.


Stable fixed-loader pipeline: 57 unit/service tests, 5 dedicated PGlite schema tests, type checking, 14 PostgreSQL tests, production build, bundle scan (22 assets), 26 production browser tests (1.4 min), pristine local verifier (19/19), and complete connected Supabase browser suite (23/23, 6.7 min) passed. The real-connected run includes all existing E1/researcher/invite cases plus all four E2 assignments, persisted accommodation, delayed C/F5 completion and withdrawal. Production HTTP smoke passed `/` 200, `/dev/study` 404 and `/api/admin/stats` 401. Final development rerun pending.

Lint exits 0 with one exhaustive-deps warning about incrementing a ref in cleanup. This is a numeric cancellation generation, not a DOM-node ref; reading/incrementing the actual current generation is intentional. Source has no lint errors. No stale numeric generation is captured, no eligibility timer is altered and the obsolete-response regression is verified independently. This warning will be removed in the subsequent shared strategy refactor without changing cancellation behavior.


### Final M2 verification

| Check | Actual final result |
|---|---|
| Clean install | 414 packages; 0 audit findings; no dependency/lock changes |
| Original spec / canonical lesson / WAVs | Unchanged; verifier covers 5 segments, 327.0 seconds |
| Unit/service | 57/57 across 9 files; includes PGlite and pure browser-model fixtures |
| Dedicated PGlite schema | 5/5; separate from real PostgreSQL |
| Lint / types | PASS; 0 lint errors, 1 cancellation-ref heuristic warning described above |
| Real PostgreSQL 17 | 14/14, including concurrent E2 allocation and study identity constraints |
| Development Chromium | 26/26, 3.2 min; includes public/UI contracts and browser-only SYNTHETIC simulation |
| Build / learner assets | PASS; 22 assets without keys, rationales, rubrics or server secret names |
| Production Chromium | 26/26, 1.4 min; dev-only route 404 |
| Production HTTP smoke | `/` 200; `/dev/study` 404; `/api/admin/stats` 401 |
| Local Supabase security audit | 19/19 on pristine closed schema |
| Real local Supabase Auth/MFA/PostgreSQL browser suite | 23/23, 6.7 min; no participant HTTP mocks |
| Responsive/accessibility | All 4 E2 arms at 360/768/1280; no axe WCAG 2.2 AA violations/overflow; keyboard transcript toggle |
| Regression sensitivity | Held obsolete response passes fixed code, fails when only its guard is disabled; exact fixed source restored |
| Diff / targeted credential patterns | PASS including changed/new UTF-8 text; populated env/state files ignored |

The single held-response regression is explicitly an HTTP contract fixture, not evidence of a connected backend. Public media-failure tests mock only the failing media boundary. Connected cases use real local services and actual TOTP, with only SYNTHETIC rows shifted for delayed eligibility. Screenshots were visually reviewed at mobile/tablet/desktop widths. Manual screen readers/devices, independent listening/objective equivalence, rights, pilot suitability and every human approval remain open. No hosted security/deployment/backup claim is made.


## M3 chunking - 2026-10-24 (verified)

Focused evidence: 5 E3 tests passed using PGlite/static rendering and the browser model. They cover closed/pilot/time-policy/minor guards, exact canonical partitions/text/media, unique SVG IDs, server-derived visits, UUID-deduplicated counters, frozen source-vs-contract versions, legacy migration preservation, study-scoped exports and model persistence. Existing 57 unit/service tests also passed before the new cases were added. Initial three-arm development browser audit passed (3/3, 53.5 seconds) with source paragraph parity, keyboard group navigation, refresh, no research requests and axe/overflow at 360/768/1280. Media exclusivity/rate checks were then added and await the full rerun. Type checking caught and fixed one missing visibleSegments import. Full native PostgreSQL/connected and clean-install suites are pending; no passing count is inferred from an incomplete run.


### Final M3 verification

| Check | Actual final result |
|---|---|
| Clean install | 414 packages; 0 audit findings; unchanged dependencies/lock |
| Source/spec/audio | PASS: shared-v6 source freeze; canonical lesson and 327.0 seconds of WAV bytes unchanged; original spec unchanged |
| Unit/service | 62/62 across 10 files, including PGlite and isolated model fixtures |
| Dedicated PGlite schema | 5/5 |
| Lint / type checking | PASS, 0 errors and 0 warnings; M2 cleanup-ref warning removed |
| Real PostgreSQL 17 | 15/15, including 9 concurrent E3 allocations and concurrent duplicate activity events |
| Development Chromium | 29/29, 4.2 min |
| Production build / bundle | PASS, 22 learner assets without keys/rubrics/rationales/server secret names |
| Production Chromium | 29/29, 1.5 min; /dev/study 404 |
| Pristine local Supabase security | 19/19 |
| Connected local Supabase Auth/MFA/PostgreSQL Chromium | 24/24, 7.2 min; no participant HTTP mocks |
| Production HTTP smoke | `/` 200; `/dev/study` 404; `/api/admin/stats` 401 |
| E3 layouts and accessibility | All 3 arms at 360/768/1280; zero axe WCAG 2.2 AA violations/overflow; keyboard group navigation |
| Content and media | Exact full traversal paragraphs/order, identical sources/essential diagrams; unique SVG IDs; one active narration; fixed 1x |
| Migration/version semantics | Legacy rows retain source/presentation versions; null measurement/policy metadata remains uncollected rather than measured zero |

The focused real-connected E3 workflow passed 1/1 (1.3 min) before the full suite. It verifies all three assignments, exposure count 1 then 2 on actual refresh, server-derived group visits, positive bounded visible-time proxies, immediate/F3, early one-hour refusal, C/F5 completion and withdrawal. Pure model and HTTP-contract tests remain distinct from real database services. Representative screenshots were visually reviewed; screen-reader/device, independent listening, educational equivalence, pacing/viewport policy and scientific/ethics/rights approvals remain pending. No hosted deployment/security/backup claim is made.
