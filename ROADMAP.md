# VisualLearn roadmap

Latest owner scope (2026-10-24): finish and verify M4 locally, including response-based heuristics, then commit. M5 hosting and M6 external approvals/pilot are deferred, with no recruitment. No app host is configured. M1–M3 are already implemented; M4 is verified locally; completion evidence is in PROGRESS.md and docs/QA.md.

Continuation sequence (2026-10-24): establish the full Windows baseline, then M1 shared academic UI, M2 modality, M3 chunking, M4 remaining research mechanisms/analysis, M5 hosting validation and M6 approval packets/pilot runbook. Human reviews remain open. The historical milestone table below is retained; hosted staging is recorded as created in later decisions, while app hosting remains pending.

Baseline is green and pushed (`9b0d509`). M1 is verified (21 dev/21 production/22 connected browser tests plus static/unit/PG checks). M2 modality is verified and remains closed to recruitment. M3 chunking is verified and remains closed. M4 research mechanisms/analysis is verified locally; M5/M6 remain outside the current local scope.

This is a staged roadmap, not a promise to conduct eight human studies. Follow the original specification and latest user scope. No recruitment before approved protocol, consent, content and infrastructure validation.

| Milestone | Completion evidence | Status / dependencies |
|---|---|---|
| 1. Local foundation improvements | Canonical lesson, accessible media, resilient assessments, isolated synthetic demo and passing checks | Done locally: v2 forms, questionnaire drafts, real PostgreSQL concurrency tests |
| 2. Multimedia learning experiments | E2 modality/E3 chunking strategies and separately reviewed pilot contracts | E2 and E3 engineering verified, draft/closed; E4-E8 disabled |
| 3. Additional courses and educational content | Reuse canonical schema, original licensed assets and objective mapping | Deferred until Water Cycle E1 is validated; none in this session |
| 4. Research experiment and assessment completion | Reviewed parallel forms, ordering/labeling/scenarios, blind ratings, debrief and distinct optional seven-day path | Engineering done for ordering/labeling/scenario and blind rating; draft debrief and optional D/F6 engineering implemented in M4; educator review and registered measures remain |
| 5. Research dashboard and data analysis | Codebook, item exports, quality/retention views, reproducible estimates | Codebook, item/written exports, retention and quality views verified on SYNTHETIC data; M4 charts, response-based review and SYNTHETIC export analysis implemented |
| 6. Supabase staging and research validation | Authorized staging, non-owner role, two-client allocation, connected recovery/timing/export/security checks | Rehearsed in full on a local Supabase stack (`test:connected`, `verify:staging`); hosted project is recorded as configured; hosted participant/restore verification is deferred |
| 7. Deployment and final evaluation | HTTPS/backups/retention/MFA, approved content/consent freeze, staged pilot and responsible reporting | MFA implemented; hosting choice, backups/restore drill and approvals pending ([review packets](docs/REVIEW_PACKETS.md)) |

Stabilize E1 before adding modalities or courses. Finish a bounded milestone, document actual checks and push without force or unrelated history changes.
