# Verification record — 2026-10-16

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
