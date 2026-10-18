# VisualLearn progress

Current milestone (2026-10-18, after `c812d73`): reliable E1 Water Cycle foundation, verified locally. Branch `feat/visuallearn-foundation`. Original specification unchanged. **No hosted Supabase project, no deployment, no human research and no approvals.**

## Implemented and tested (local)

| Area | Implemented | How it was tested |
|---|---|---|
| Assessments | Forms A/B/C v2: shared blueprint with recall MCQs, ordering (any cycle start), neutral diagram labeling, conceptual and transfer items; B/C written scenario + free recall answered first and locked; server-only keys/rubrics | Unit tests (blueprint parity, lesson-fact coverage, rotation scoring, no keys in projections, identical forms across conditions); axe/keyboard/overflow at 360/1280 px; post-build bundle scan |
| Questionnaires | F3/F5 drafts survive refresh; explicit F5 discussion answer; sources only when review reported | Unit tests; development browser test; connected test against PostgreSQL |
| PostgreSQL | Migration 002, private migration ledger, non-owner runtime login | `test:pg` on real PostgreSQL 17: 13 tests, plus a mutation check proving the allocation lock is what keeps 30 concurrent assignments balanced |
| Connected study | Consent → A → lesson → B → F3 → +60 min C → F5 through the real API and database | `test:connected` on local Supabase: two simultaneous browsers, refresh, second tab, network failure + retry, replayed submission, return link after browser closure, faked device clock, dev-clock isolation, early/expired follow-up, withdrawal, forged cookies |
| Security | Anonymous API access denied; participant isolation; researcher allowlist + mandatory TOTP MFA; session expiry and sign-out revocation | `verify-staging` (19 read-only checks) and 8 researcher browser tests against local Supabase Auth (GoTrue), including a real 90 s token expiry |
| Researcher tools | Dashboard (allocation, funnel, scores, retention, follow-ups, data quality, versions, rating coverage), blind scoring + adjudication, item-level and written exports, `codebook.json`, `data_dictionary.md` | Connected tests: dashboard equals DB, every export row count equals DB, withdrawn participant absent, no UUIDs/codes/emails/tokens, every column documented, two raters → adjudication |

Bugs found and fixed this milestone: the migration ledger in `public` was readable and **writable by anonymous Supabase users** (could make migrations be skipped); return-link recovery raced under re-run effects and showed "session required"; F5 silently preselected "No"; client disconnects were logged as internal errors; the runtime-role script and local Auth config were incompatible with Supabase. Details: [DECISIONS](docs/DECISIONS.md).

## Verification summary

Commands, counts and conditions: [QA](docs/QA.md). In short: content hashes, lint, typecheck, 48 unit tests, 5 PGlite tests, 13 PostgreSQL tests, 15 development and 15 production browser tests, bundle scan, production smoke test (`/dev/study` 404), 19/19 staging-verifier checks and 16/16 connected tests all pass.

## Not done, not verified or not approved

- **Hosted staging (task 3) and hosting (task 8) were not created**: no Supabase or hosting account access was available. Hosted migration, hosted Auth/MFA, backups and restore, HTTPS and logging settings are unverified. Runbook: [DEPLOYMENT](docs/DEPLOYMENT.md); audit tool: `npm run verify:staging`.
- **External reviews and approvals (task 7) are not obtained**: educator review, narration rights, supervisor decisions, consent wording/contact, retention/deletion, debrief and ethics. Prepared packets: [REVIEW_PACKETS](docs/REVIEW_PACKETS.md). Minors stay blocked.
- Not implemented: physical deletion after withdrawal (awaits retention policy), approved debrief screen, optional seven-day form D, analysis charts. The analysis script was not run on exported data.
- Not tested: other browsers and real mobile devices, manual screen-reader audit, human usability, psychometric equivalence of forms or rubric reliability.

## Next steps

1. With the owner's Supabase account: create the staging project, follow [DEPLOYMENT](docs/DEPLOYMENT.md) §2 and record `npm run verify:staging` output.
2. Send [REVIEW_PACKETS](docs/REVIEW_PACKETS.md) to the educator and supervisor; version any changes to the banks.
3. Choose a host, deploy staging, repeat the SYNTHETIC workflow there and run a backup-restore drill. Recruitment stays closed until ethics approval.
