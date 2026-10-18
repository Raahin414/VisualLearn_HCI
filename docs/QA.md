# Verification record — 2026-10-18

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
