# Research data dictionary

Windows baseline maintenance (2026-10-24) changes test process launching, timing budgets and the disposable database port only. No research schema, scoring rule, export column or retention rule changes.

M1 advances the recorded shared-shell stimulus version to `density-v4-draft` and expands the source hash manifest to the layout/header/public lesson player/shared button primitive. Existing session version/hash fields carry this change; no new data fields are introduced. Cached narration status synchronization and button hydration readiness emit no new telemetry events.

The authoritative, column-by-column dictionary is generated from code (`lib/admin/codebook.ts`) and downloaded by authorized researchers as `data_dictionary.md` and `codebook.json` (items, keys, rubrics, survey options). The connected test suite fails if any exported column is undocumented. This page summarises the datasets.

All timestamps are UTC. Exported `participant_id`, `session_id` and `attempt_id` are `VL_` + 24 hex characters of SHA-256 of the internal UUID: stable for joins, not the database IDs. No names, emails, exact birthdates, IP addresses, user-agent strings, public participant codes, return tokens or researcher identities are exported. Written responses are verbatim and may contain volunteered identifiers; review them before sharing. **Withdrawn participants are excluded from every file.**

Migrations 007–008 add private identifier tables: `participant_identity(participant_id, student_name, erp)` for the original E1 flow, and `course_student_identity(id, student_name, erp)` for the five-course flow. `course_attempts` joins the latter by `identity_id` and records `course_slug`, `density`, frozen `content_version`, consent version/time and adult/voluntary/data-use affirmations, submitted `answers`, `score`, `started_at`, `submitted_at` and `withdrawn_at`. The authenticated Student records tab joins identifiers for review; CSV research exports do not. Course quiz scores are out of four and have no baseline or delayed follow-up equivalent yet.

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


## Current E1 scope

Only E1 records enter current dashboards, rating queues and exports. experiment_id remains E1 for joins; arm_key is low/medium/high. Presentation density-v6-e1-draft and source e1-v8-draft identify the revised stimuli. Historical metadata columns (study_time_policy, exposure_measure_version, active_time_ms, presentation_exposures, accommodations) remain for upgrade compatibility; no non-E1 exposure metric is newly collected. Null measurement metadata is not a measured zero. Historical non-E1 rows are preserved and archived by migration 006, not pooled into E1 analysis.

## M4 optional D and response-based review

Migration 005 adds experiment seven_day_enabled/reviewed (false by default), seven_day_form_version and seven_day_window_minutes (null by default). New opted-in session fields seven_day_form_version, seven_day_bank_sha256 and seven_day_window_minutes freeze the distinct optional contract; all are null on legacy/non-opted sessions. State adds waiting_7d and 7d_test_complete. Form D is 1.0-seven-day-draft at plus_7d; F6 is the 1.0-seven-day-exposure-draft questionnaire using the F5 exposure fields. Seven-day due is lesson_completed_at + seven UTC days. C/F5 and their one-hour schedule remain separate and unchanged. No live grace interval is invented.

The codebook now includes A/B/C/D and their distinct version metadata, written prompts, rubrics, F6 description and response-review-v1-draft rules. Existing A/B/C/P question objects remain unchanged. Exported session optional fields and every D item are documented by the generated dictionary. F6 answers capture interim review/discussion/confidence/effort at their own timepoint.

Response review is derived on demand, never a stored participant score. Each rule includes id/title/check/action, cohort/presentation, form/version, eligible count and flagged count. Invalid/missing/N/A answers are excluded. Counts are scoped to non-withdrawn records and never pool experiments or instrument versions. The local SYNTHETIC simulator uses its submitted answers without SQL or grading. Analysis/SYNTHETIC-results includes derived response_review.csv with data_kind and rule_version, plus a manifest hash of the rule source. No free text is returned in these summaries.

Privacy configuration retention_approved is false by default; retention_policy_version and withdrawal_retention_days are null. The inactive physical-deletion operator requires the process flag, exact approved policy, elapsed delay and prior withdrawal. Private deleted_allocation_counts contains only experiment/age-band/arm/count, with no participant/session ID or timestamp, preserving historical allocation balance after deletion. It is not a research export. audit_log records only a generic deletion action, never the deleted identity. The aggregate scope and backup expiry still require policy review.
