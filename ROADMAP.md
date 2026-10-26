# VisualLearn roadmap - E1 only

Owner scope, 26 October 2026: five science courses, each presented in low, medium and high visual density. E1 is the one experimental factor; E2–E8 are not required. Names and ERP are collected only for approved recorded participation and shown only to authenticated researchers.

Current implementation: five draft course pages and four-question checks, server-assigned density and private PostgreSQL result storage, plus a restricted Student records tab. The original Water Cycle longitudinal E1 workflow remains. Both recording gates are closed by default. The five-course content and instruments need educator review; new course runs have an immediate quiz only and must not be reported as equivalent to the original baseline/one-hour protocol.

1. **Restructure around density (implemented locally):** one registry entry, density-only previews, student navigation, participant API, researcher workspace and exports. Preserve canonical text/audio/objectives and existing research records.
2. **Verify locally (passed; see docs/QA.md):** tests, concurrency, version freeze, three-width accessibility/screenshots, production boundary and connected E1 workflow.
3. **Update staging:** apply forward migration 006 with an authorized owner, deploy compatible app, verify configuration, then rehearse the hosted SYNTHETIC participant and researcher workflow. No real enrollment.
4. **Complete operational readiness:** SMTP if required, backup/restore drill, logging/retention and approved deletion handling.
5. **Obtain human reviews:** educator/content and assessment review, narration rights, protocol/sample/analysis plan, consent/contact, retention/debrief and ethics where required.
6. **Run an approved E1 pilot:** baseline -> saved density -> lesson -> immediate B/F3 -> one-hour C/F5. Optional seven-day D/F6 remains separately reviewed and off by default.
7. **Collect and report:** only after approval; analyze E1 frozen cohorts, missingness and limitations. No fabricated findings or attention claims.

Historical migrations and chronology remain for reproducibility and upgrades. No implementation of seven additional experiments is needed for completion.
