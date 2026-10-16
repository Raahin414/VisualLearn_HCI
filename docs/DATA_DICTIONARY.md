# Research data dictionary

All timestamp columns are UTC `timestamptz`. IDs are opaque UUIDs internally; exported participant_id/session_id/attempt_id are consistent SHA-256-derived keys. No names, email, exact birthdate, IP address or full user-agent are collected in study tables. Free-text responses may contain volunteered identifiers and require review before release.

| Dataset | Main fields / interpretation |
|---|---|
| participants_deidentified | participant_id, age_band, language, consent_version, consent_at, created_at; withdrawn rows excluded |
| assignments | participant_id, experiment_id, arm_key, randomization_version, assigned_at; withdrawals remain in allocation counts but not exports |
| sessions | session_id, participant_id, state, content/protocol/stimulus versions and SHA-256 hashes, accommodations, timestamps |
| assessment_attempts | attempt_id, session_id, timepoint (`pre`,`immediate`,`plus_60m`; `plus_7d` reserved), form key/version, open/submit times, correct, max_score, scoring/rubric versions |
| item_responses | attempt_id, session_id, timepoint, answers_json (question ID → option index), free_recall (unscored verbatim text). One row per attempt; explode answers_json for item analysis |
| free_recall_ratings | attempt_id, rater_code, rubric_version, five sub_scores (0–2), total_score (0–10), rated_at; table exists, blind-rater UI pending |
| surveys | session_id, F3 or F5, version, answers_json, submitted_at. F3 Likert 1–5 and N/A; mentalEffort separate 1–9. F5 recallEffort separate 1–9 |
| followup_status | session_id, timepoint, due/deadline, status, completed_at. Default strict +60–90min; no late scores accepted yet. Missing follow-up is never zero-imputed |
| events | session_id, allowlisted event_type, optional segment_id, elapsed_ms (page-lifetime monotonic clock), client_time, authoritative server_received_at, bounded payload |

CSV cells that could execute spreadsheet formulas are prefixed with an apostrophe. JSON columns use escaped JSON. Exports are audited. A browser event is a behavior observation, not a gaze or cognitive-attention measure. Queue caps can drop old events; missing telemetry is not inactivity. Client elapsed time resets on reload; use client/server timestamps and segment transitions for cross-page interpretation.

F0 contains language comfort, prior familiarity and consent booleans, but the current participant export does not expose its full JSON. Additional approved demographic/accommodation/device and item-level expanded export columns remain to finalize. Codebook JSON is not yet generated.
