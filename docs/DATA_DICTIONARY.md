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
