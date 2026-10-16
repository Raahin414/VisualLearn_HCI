# Decisions and unresolved approvals

Date: 2026-10-16. Branch: feat/visuallearn-foundation.

- Use the requested Next.js/React/TypeScript/Tailwind stack in the supplied GitHub repository. Local implementation only; no alternative hosting service is provisioned.
- v2 overrides v1: required follow-up is +60 minutes from server lesson completion; optional +7 days is distinct. Draft grace window is 30 minutes; expiry is strict pending an approved late-return policy.
- One canonical English lesson and fixed narration assets power all E1 renderings. Only supportive and decorative SVG layers vary. Controls, text and audio remain identical. No density selector exists in research mode.
- Demonstration mode is public and stores only local progress. It creates no participants or research telemetry. Practice scores are transient and clearly outside research.
- E1 is technically testable but draft. E2–E8 are registry definitions only and cannot recruit. Live enrollment is disabled by default and must remain blocked before approval.
- Adults 18–30 are the initial proposed population. Minors require institutional authorization, independently verified guardian consent and assent; a checkbox cannot establish this.
- PostgreSQL is the research authority. No in-memory database fallback silently accepts research data. Local PostgreSQL-compatible tests are synthetic and disposable.
- Assessment banks, surveys, free-recall rubrics and primary endpoint need supervisor/educator review. Do not describe researcher-created questionnaires as validated scales.
- Original diagrams/copy: no proprietary course assets. USGS is used for factual checking, not copied imagery. Local synthesized audio, if generated, is a development artifact pending voice redistribution and educator review.
- Withdrawal: deny future access immediately; exclude withdrawn records from exports. Final deletion/retention policy and study contact details require approval.
- Unresolved: primary endpoint registration, age bands/sample planning, time window/late handling, seven-day inclusion, consent wording/contact, audio licensing, content/instrument validation, deployment credentials and real Supabase migration execution.
