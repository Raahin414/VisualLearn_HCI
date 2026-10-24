# VisualLearn progress

## M2 modality - verified, recruitment closed (2026-10-24)

Four server-assigned modality arms reuse the canonical script/audio/essential diagram; audio transcripts are explicit recorded accommodations. Additive migration 003 preserves legacy E1 rows and enforces study identity. E2 is available only in the development simulator and remains closed to real recruitment. Exports distinguish studies and dashboard summaries are scoped by experiment. E1 rendering advances to density-v5-draft and E2 to modality-v1-draft; canonical source/audio/spec bytes are unchanged.

Verified: clean install (414 packages, audit 0), 57 unit/service tests (includes PGlite), 5 dedicated PGlite schema tests, lint (0 errors, 1 cancellation-ref warning), types, 14 real PostgreSQL tests, optimized build, 22 clean browser assets, 26 development browser tests (3.2 min), 26 production browser tests (1.4 min), 19 local security checks and 23 connected Supabase tests (6.7 min). Production HTTP smoke is 200/404/401. A controlled obsolete-response regression passed and failed when its guard was deliberately disabled; exact source bytes were restored and verified. Failed/interrupted attempts are recorded in QA. M3 chunking is next. Manual device/screen-reader and human scientific/ethics reviews remain open. No hosted changes or human approvals have been performed.

## M1 shared academic UI — verified, 2026-10-24

Baseline infrastructure was committed/pushed as `9b0d509` and the remote hash verified. M1 introduces shared type/spacing/radius/focus tokens, readable metadata, consistent form surfaces and simpler public copy, removing decorative rotations/shadows/emoji. It fixes cached narration status and prevents callback/form buttons being activated before hydration. Dashboard tables support keyboard scrolling. Draft stimulus version is `density-v4-draft`; layout/header/public player/button sources join the manifest. Canonical lesson JSON, objectives, WAVs, assessment wording and SVG tiers remain unchanged.

Verified: clean install; 51 unit/service tests (including PGlite), dedicated 5-test schema run, lint/types, 13 real PostgreSQL tests, 21 development and 21 production browser tests, 22 clean browser assets, 19 local security checks and 22 connected Supabase tests. Axe includes WCAG 2.2 AA rules; 360/768/1280 screenshots are in `docs/screenshots/m1-before/` and `m1-after/`. Manual screen-reader/device and human research reviews remain open. M2 modality is next; E2–E8 remain unrecruitable.

## Windows baseline verification — 2026-10-24

Current checkout is `9ecc795` on `feat/visuallearn-foundation`; the newer revisions named in the continuation prompts are not on origin. The Windows staging launcher and local test harnesses now launch installed CLIs directly. Browser suites use one worker and bounded longer timeouts for cold compilation on this machine. Local PostgreSQL uses port 15439 (override with `VISUALLEARN_PG_PORT`) because Windows reserves the previous port.

Verified: content/spec hashes, 51 unit/service tests, 5 PGlite schema tests, lint/typecheck, 13 real PostgreSQL tests, 16 development browser tests, production build, 22 clean browser assets, 16 production browser tests, production 200/404/401 boundaries, 19 local security checks and 22 connected Supabase browser tests. M1 has not started. Earlier failed runs are recorded in `docs/QA.md`.

Hosted Supabase staging is **recorded as existing** in the later decisions/deployment entries. Older statements below and in historical handoffs saying no hosted project exists are superseded. Hosting, hosted participant workflows, backup/restore and human approvals remain unverified; recruitment remains closed.

Current milestone (2026-10-18, after `c812d73`): reliable E1 Water Cycle foundation, verified locally. Branch `feat/visuallearn-foundation`. Original specification unchanged. **No hosted Supabase project, no deployment, no human research and no approvals.**

## Implemented and tested (local)

| Area | Implemented | How it was tested |
|---|---|---|
| Assessments | Forms A/B/C v2: shared blueprint with recall MCQs, ordering (any cycle start), neutral diagram labeling, conceptual and transfer items; B/C written scenario + free recall answered first and locked; server-only keys/rubrics | Unit tests (blueprint parity, lesson-fact coverage, rotation scoring, no keys in projections, identical forms across conditions); axe/keyboard/overflow at 360/1280 px; post-build bundle scan |
| Questionnaires | F3/F5 drafts survive refresh; explicit F5 discussion answer; sources only when review reported | Unit tests; development browser test; connected test against PostgreSQL |
| PostgreSQL | Migration 002, private migration ledger, non-owner runtime login | `test:pg` on real PostgreSQL 17: 13 tests, plus a mutation check proving the allocation lock is what keeps 30 concurrent assignments balanced |
| Connected study | Consent → A → lesson → B → F3 → +60 min C → F5 through the real API and database | `test:connected` on local Supabase: two simultaneous browsers, refresh, second tab, network failure + retry, replayed submission, return link after browser closure, faked device clock, dev-clock isolation, early/expired follow-up, withdrawal, forged cookies |
| Security | Anonymous API access denied; participant isolation; researcher allowlist + mandatory TOTP MFA; session expiry and sign-out revocation | `verify-staging` (19 read-only checks) and 8 researcher browser tests against local Supabase Auth (GoTrue), including a real 90 s token expiry |
| Researcher accounts | `/admin/accept` for invitations and password recovery, then mandatory authenticator; "Forgot password?" with no account enumeration | 6 connected tests with real invite/recovery links on local Supabase Auth; axe at 360 px |
| Researcher tools | Dashboard (allocation, funnel, scores, retention, follow-ups, data quality, versions, rating coverage), blind scoring + adjudication, item-level and written exports, `codebook.json`, `data_dictionary.md` | Connected tests: dashboard equals DB, every export row count equals DB, withdrawn participant absent, no UUIDs/codes/emails/tokens, every column documented, two raters → adjudication |

Bugs found and fixed this milestone: the migration ledger in `public` was readable and **writable by anonymous Supabase users** (could make migrations be skipped); return-link recovery raced under re-run effects and showed "session required"; F5 silently preselected "No"; client disconnects were logged as internal errors; the runtime-role script and local Auth config were incompatible with Supabase. Details: [DECISIONS](docs/DECISIONS.md).

## Verification summary

Commands, counts and conditions: [QA](docs/QA.md). In short: content hashes, lint, typecheck, 48 unit tests, 5 PGlite tests, 13 PostgreSQL tests, 15 development and 15 production browser tests, bundle scan, production smoke test (`/dev/study` 404), 19/19 staging-verifier checks and 16/16 connected tests all pass.

## Not done, not verified or not approved

- **Hosted staging now exists** (`visuallearn-staging`, Mumbai): migrated, restricted runtime login, Auth hardened, 2 of 3 researchers invited and allowlisted, `verify:staging` 19/19. Not yet done there: researchers accepting invites (needs `npm run dev:staging` until hosting exists), a SYNTHETIC end-to-end run against staging, and a backup-restore drill. **Hosting (task 8) is not set up.**
- **External reviews and approvals (task 7) are not obtained**: educator review, narration rights, supervisor decisions, consent wording/contact, retention/deletion, debrief and ethics. Prepared packets: [REVIEW_PACKETS](docs/REVIEW_PACKETS.md). Minors stay blocked.
- Not implemented: physical deletion after withdrawal (awaits retention policy), approved debrief screen, optional seven-day form D, analysis charts. The analysis script was not run on exported data.
- Not tested: other browsers and real mobile devices, manual screen-reader audit, human usability, psychometric equivalence of forms or rubric reliability.

## Next steps

1. With the owner's Supabase account: create the staging project, follow [DEPLOYMENT](docs/DEPLOYMENT.md) §2 and record `npm run verify:staging` output.
2. Send [REVIEW_PACKETS](docs/REVIEW_PACKETS.md) to the educator and supervisor; version any changes to the banks.
3. Choose a host, deploy staging, repeat the SYNTHETIC workflow there and run a backup-restore drill. Recruitment stays closed until ethics approval.
