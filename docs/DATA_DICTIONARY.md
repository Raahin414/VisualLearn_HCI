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
