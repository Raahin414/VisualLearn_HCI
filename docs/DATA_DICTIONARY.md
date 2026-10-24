# Research data dictionary

Windows baseline maintenance (2026-10-24) changes test process launching, timing budgets and the disposable database port only. No research schema, scoring rule, export column or retention rule changes.

M1 advances the recorded shared-shell stimulus version to `density-v4-draft` and expands the source hash manifest to the layout/header/public lesson player/shared button primitive. Existing session version/hash fields carry this change; no new data fields are introduced. Cached narration status synchronization and button hydration readiness emit no new telemetry events.

The authoritative, column-by-column dictionary is generated from code (`lib/admin/codebook.ts`) and downloaded by authorized researchers as `data_dictionary.md` and `codebook.json` (items, keys, rubrics, survey options). The connected test suite fails if any exported column is undocumented. This page summarises the datasets.

All timestamps are UTC. Exported `participant_id`, `session_id` and `attempt_id` are `VL_` + 24 hex characters of SHA-256 of the internal UUID: stable for joins, not the database IDs. No names, emails, exact birthdates, IP addresses, user-agent strings, public participant codes, return tokens or researcher identities are exported. Written responses are verbatim and may contain volunteered identifiers; review them before sharing. **Withdrawn participants are excluded from every file.**

| Dataset | Grain and main fields |
|---|---|
| participants_deidentified | One row per participant: age band, language, language comfort (1–5), prior familiarity (1–5), consent version and time |
| assignments | One row per participant: experiment, arm (low/medium/high), randomization version, time |
| sessions | One row per session: state, content/protocol/stimulus versions and SHA-256 hashes, follow-up window, timestamps |
| assessment_attempts | One row per form opened: timepoint (pre/immediate/plus_60m), form and version, opened/submitted, duration, correct (0–8), scoring and rubric versions |
| item_responses | One row per item answered: item id, type (mcq/ordering/labeling), skill, objective, response, auto score (0/1) |
| written_responses | One row per written answer: free recall or scenario text, rubric version, character count |
| free_recall_ratings | One row per rater × response: rater code `R-…`, response kind, per-criterion 0–2 scores, total |
| rating_adjudications | One row per resolved disagreement: agreed sub-scores and total, adjudicator code |
| surveys | One row per questionnaire: F3 (Likert 1–5 with N/A, mental effort 1–9) or F5 (review, sources only if reviewed, discussion, confidence 1–5, recall effort 1–9) |
| followup_status | One row per scheduled follow-up: due (+60 min from server lesson completion), deadline, status (not_started shown as expired after the deadline) |
| events | One row per accepted telemetry event: allowlisted type, chapter, elapsed time, client and server times, bounded payload |

CSV cells that start like spreadsheet formulas are prefixed with an apostrophe. JSON columns are escaped JSON. Every download is written to the audit log. Telemetry events are behavior observations, not attention measures; queue caps can drop events and missing telemetry is not inactivity. Missing follow-ups are never zero-filled.


## M2 modality additions (draft)

`participants_deidentified.experiment_id` and `sessions.experiment_id` distinguish E1/E2 even before baseline allocation. Session `presentation_version` freezes the renderer contract and `lesson_opened_at` is the first server request time (not attentive exposure); null is retained for legacy records. Participant, assignment and session study identities are linked by database constraints.

E2 assignment arms are text-only, audio-only, text-diagram and audio-diagram. `randomization_version=age-stratified-minimum-v2` identifies E2 allocation, with persisted random ties; E1 remains v1. All four arms use the same canonical scripts, objective assessments and one-hour window. No real recruitment is enabled.

`accommodation_used` requires a valid segment and `payload.accommodation=transcript`, only for an assigned audio arm. `sessions.accommodations["transcript:segment-id"]` stores first server receipt in UTC; event IDs deduplicate retries. Client timestamps never determine eligibility. Channel-incompatible audio/diagram events are rejected for E2. Absence of an accommodation event does not establish complete attentive exposure or successful delivery under abrupt process termination.

F3 E2 uses `2.1-modality-draft` and also allows categorical `support=not_applicable`; E1 F3 remains `2.0.0-draft`. Never recode N/A as zero. Exported assessments still use A/B/C and the same server-only keys. Dashboard summaries select one experiment; exports include all non-withdrawn studies and must be joined and stratified by experiment and frozen versions.

New experiment configuration fields `pilot_contract_version` and `pilot_reviewed` are operational review gates, default null/false. They do not signify ethics, content or supervisor approval and do not replace existing recruitment gates.

Final M2 engineering verification is recorded in QA. Loader cancellation and readiness safeguards add no research fields or eligibility clock controls. Source version is density-v5-draft for E1 and modality-v1-draft for E2; F3 modality is separately versioned 2.1-modality-draft. Canonical content/audio and A/B/C/rubric bytes remain unchanged.


## M3 chunking additions (draft)

E3 arm_key is chunked, grouped or all-at-once. presentation_version=chunking-v1-draft freezes groups [1,1,1,1,1], [3,2] or [5] in the canonical order. New session stimulus_version=shared-v6-draft tracks shared rendering source independently from the unchanged E1/E2 presentation contracts. Legacy versions/hashes stay intact.

Session study_time_policy=self-paced-no-minimum-v1 is frozen for E3; experiment activation requires that exact reviewed policy and pilot contract. Null for legacy/E1/E2 means no new policy field was collected. exposure_measure_version=visible-interval-v1 identifies E3 counters; null identifies uncollected counters and must not be analysed as observed zero time/exposure.

presentation_exposures increments on UUID-deduplicated presentation_exposed group events, with refresh/revisits included. active_time_ms sums validated client-reported visible intervals from active_time events (each 1-30000ms). Payload groupIndex is 0-based within the assigned projection; segment_id must belong to that group. Server ownership/version/withdrawal validation remains mandatory. Events are receipt-deduplicated before updating counters. Wrong-group and misplaced interval fields are rejected.

These are client exposure proxies, not attentive study time. Hidden audio listening, browser suspension/capped intervals, offline process loss and concurrent tabs limit interpretation. No proxy changes eligibility. Progress visited_segments records all concepts in each displayed server-derived group, not reading completion. Analysis must stratify by experiment, source/contract/instrument versions and measurement availability.

Final M3 verification passed 62 unit/service, 15 native PostgreSQL and 24 connected Supabase cases. A group is requested for display, not proven read; presentation_exposed represents a committed group mount, while document visibility transitions are recorded separately. A tab return to an already-mounted group does not create a new mount count.


## M4 optional D and response-based review

Migration 005 adds experiment seven_day_enabled/reviewed (false by default), seven_day_form_version and seven_day_window_minutes (null by default). New opted-in session fields seven_day_form_version, seven_day_bank_sha256 and seven_day_window_minutes freeze the distinct optional contract; all are null on legacy/non-opted sessions. State adds waiting_7d and 7d_test_complete. Form D is 1.0-seven-day-draft at plus_7d; F6 is the 1.0-seven-day-exposure-draft questionnaire using the F5 exposure fields. Seven-day due is lesson_completed_at + seven UTC days. C/F5 and their one-hour schedule remain separate and unchanged. No live grace interval is invented.

The codebook now includes A/B/C/D and their distinct version metadata, written prompts, rubrics, F6 description and response-review-v1-draft rules. Existing A/B/C/P question objects remain unchanged. Exported session optional fields and every D item are documented by the generated dictionary. F6 answers capture interim review/discussion/confidence/effort at their own timepoint.

Response review is derived on demand, never a stored participant score. Each rule includes id/title/check/action, cohort/presentation, form/version, eligible count and flagged count. Invalid/missing/N/A answers are excluded. Counts are scoped to non-withdrawn records and never pool experiments or instrument versions. The local SYNTHETIC simulator uses its submitted answers without SQL or grading. Analysis/SYNTHETIC-results includes derived response_review.csv with data_kind and rule_version, plus a manifest hash of the rule source. No free text is returned in these summaries.

Privacy configuration retention_approved is false by default; retention_policy_version and withdrawal_retention_days are null. The inactive physical-deletion operator requires the process flag, exact approved policy, elapsed delay and prior withdrawal. Private deleted_allocation_counts contains only experiment/age-band/arm/count, with no participant/session ID or timestamp, preserving historical allocation balance after deletion. It is not a research export. audit_log records only a generic deletion action, never the deleted identity. The aggregate scope and backup expiry still require policy review.
