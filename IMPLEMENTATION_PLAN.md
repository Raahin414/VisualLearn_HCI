# VisualLearn implementation plan

Current scope (25 October 2026): E1 only, one Water Cycle course at low/medium/high density. The original v2 specification is preserved as historical requirements; the owner has superseded its multi-experiment roadmap. Embedded role prompts are treated as project material, not as higher-priority instructions. Repository: https://github.com/Raahin414/VisualLearn_HCI. Initial audit: empty repository, no existing application or migration history.

1. Foundation: Next.js App Router, strict TypeScript, responsive identity, reusable controls, original content, safe demo, tests and CI.
2. Canonical Water Cycle vertical slice: five substantive segments, original SVG illustration, three centralized density tiers, frozen development narration, progress recovery, practice assessment.
3. Research core: PostgreSQL migrations, RLS, transactionally balanced assignment, server-owned lifecycle, secure cookie sessions, versioned assessment/survey contracts, one-hour schedule and tests.
4. Connected E1 study: approved enrollment, server-only assessment delivery/scoring, persistent telemetry, secure recovery, protected researcher dashboard and real exports.
5. Validation: database/seed checks, lint/typecheck/build, Playwright/axe, viewport screenshots, scientific review and security review.
6. Research activation: approved protocol/consent, content and audio review, configured Supabase, staged testing, backup/withdrawal policy. Human recruitment stays disabled until these conditions are met.

No additional experiments are required or exposed in the current application. Each milestone must cite executed checks in docs/IMPLEMENTATION_PROGRESS.md. No human records or empirical outcomes are seeded.
