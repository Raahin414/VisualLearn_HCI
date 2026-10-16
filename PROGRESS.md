# VisualLearn progress

Current milestone: local MVP stabilization after `9562e94`, branch `feat/visuallearn-foundation`. The latest revision is identified by `git log -1` and the GitHub branch. Original specification unchanged. No Supabase integration, cloud deployment or human research in this milestone.

## Completed foundation

- Next.js/React/TypeScript/Tailwind application, original responsive public site, catalog and Water Cycle overview.
- Five canonical chapters, three SVG density variants, fixed development narration/transcripts, local lesson progress and separate practice bank P.
- Private PostgreSQL schema/RLS, transactional stratified allocation, server-only A/B/C scoring, F0/F3/F5 validation, one-hour scheduling, signed sessions, hashed recovery, telemetry and withdrawal.
- Gated participant workflow; protected researcher implementation/nine CSV exports; eight disabled draft definitions; CI, protocol/privacy/source/analysis scaffolds.

## Improvements in this milestone

- Shared narration player: ready/buffering/playing/paused/finished/failure feedback, replay and pause on navigation. Same assets/controls across densities.
- Accurate deduplicated chapter progress, study chapter bar, next-chapter preview, condition feedback and session retry handling. Text/diagrams/WAV bytes unchanged.
- Shared assessment UI: answer progress, scoped tab drafts, recovery after refresh/failure, duplicate-click guard, missing-answer focus, recall validation/count, and draft clearing only after success. Server rejects whitespace-only recall.
- `/dev/study`: explicitly SYNTHETIC browser simulation of A → lesson → B/recall → F3 → +60m C/recall → F5. Existing participant screens/validators, fixed condition, refresh/reset, clock/expiry controls and synthetic researcher checkpoint overview. No research requests or database writes; production returns 404.
- Storage restriction handling and regression/accessibility tests. No dependencies or alternative database architecture added.

## Verification

- `npm run test`: **35 passed** across 6 files.
- `npm run test:e2e -- --reporter=line`: **13 passed** against development server, including the new simulation without HTTP mocks.
- `npm run lint`, `npm run typecheck`: passed without errors/warnings.
- `npm run build`: optimized production build passed. `npm run test:e2e:production -- --reporter=line`: **13 passed in 17.6s**, with strict 404 enforcement for `/dev/study`.
- `npm run db:validate`: **5 passed**. Content hashes, unchanged spec/copy/banks/WAV bytes, whitespace and credential-signature review passed. No dependencies were added.
- Details: [QA](docs/QA.md) and [session handoff](docs/IMPLEMENTATION_PROGRESS.md). Git history identifies the exact checkpoint; the final response confirms the pushed remote head.

## Partial features and limitations

- Scientific/rights review is pending for content, parallel forms, questionnaires, recall rubric and narration. Research stays draft/closed; minors stay blocked.
- Simulator is one browser fixture. It does not prove PostgreSQL persistence/concurrency, authentication, exports, randomization or grading. Recovery is browser-local, not cross-device.
- Assessment drafts use tab sessionStorage, not server autosave. Closing the tab can lose unsent work. Questionnaire draft restoration remains incomplete. Submitted database attempts stay authoritative/immutable.
- Docker engine unavailable; no multi-client PostgreSQL or connected Supabase flow exercised. PGlite stays test-only.
- Ordering/labeling/scenario ratings, blind-rater UI, approved debrief, codebook/item exports, full analytics, accommodations/telemetry validation and optional seven-day follow-up remain incomplete.
- E2–E8 disabled; no new subjects, tutors, adaptation or deployed services. Existing development lint/glob advisories remain documented.

## Next local milestone

1. Finalize mixed assessment interactions and questionnaire draft recovery with reviewed, versioned content.
2. When Docker is available, run the existing schema/services against local PostgreSQL with two concurrent clients; add race/ownership regression tests.
3. Complete local researcher codebook/item exports and blind-scoring workflow before a separately authorized staging phase.

See [ROADMAP](ROADMAP.md) for dependencies and [docs/IMPLEMENTATION_PROGRESS.md](docs/IMPLEMENTATION_PROGRESS.md) for chronological evidence. The supplied original Markdown specification remains at repository root.
