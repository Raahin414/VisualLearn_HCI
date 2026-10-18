import "server-only";
import { BANK_VERSION, questionBanks, answerKey } from "@/lib/assessments/questions.server";
import { rubrics } from "@/lib/assessments/rubrics.server";
import { writtenPrompts } from "@/lib/assessments/written-prompts";
import { f3Items, f5Sources, SURVEY_VERSION } from "@/lib/assessments/surveys";
import type { ExportName } from "./exports";
const ID = "Stable pseudonymous key: VL_ + first 24 hex of SHA-256(internal UUID). Joins across files; not reversible from the export.";
// Column documentation for every export. Tests assert each exported column is documented.
export const dataDictionary: Record<ExportName, Record<string, string>> = {
  participants_deidentified: {
    participant_id: ID,
    age_band: "Self-reported age band (18-30 only; minors are blocked).",
    language: "Primary learning language from F0.",
    language_comfort: "F0 language comfort, 1 very uncomfortable to 5 very comfortable.",
    prior_familiarity: "F0 prior topic familiarity, 1 never heard to 5 know it very well.",
    consent_version: "Consent text version accepted (SYNTHETIC-* in test databases).",
    consent_at: "Server UTC time consent was recorded.",
    created_at: "Server UTC time the participant row was created.",
  },
  assignments: {
    participant_id: ID,
    experiment_id: "Registered experiment (E1 only can be enabled).",
    arm_key: "Assigned visual-density condition: low, medium or high.",
    randomization_version: "Allocation algorithm version (age-stratified minimum allocation with random ties).",
    assigned_at: "Server UTC time of assignment, after baseline submission.",
  },
  sessions: {
    session_id: ID,
    participant_id: ID,
    state: "Current lifecycle state (enrolled … finished).",
    content_version: "Canonical lesson content version.",
    content_sha256: "SHA-256 of canonical lesson JSON at enrollment.",
    protocol_version: "Protocol version from the experiment registry.",
    stimulus_version: "Rendering/assessment stimulus version label.",
    media_manifest_sha256: "Hash of the narration manifest.",
    question_bank_sha256: "Hash of forms A/B/C, written prompts and rubrics.",
    stimulus_sha256: "Hash of the stimulus source manifest.",
    followup_window_minutes: "Grace window after +60 minutes frozen at enrollment.",
    accommodations: "Recorded accommodations (JSON; currently not collected by the UI).",
    started_at: "Server UTC enrollment time.",
    lesson_completed_at: "Server UTC lesson completion time (anchors the follow-up).",
  },
  assessment_attempts: {
    attempt_id: ID,
    session_id: ID,
    timepoint: "pre (form A), immediate (form B) or plus_60m (form C).",
    form_key: "A, B or C.",
    form_version: "Question bank version.",
    opened_at: "Server UTC time the form was first served.",
    submitted_at: "Server UTC submission time (first valid submission wins).",
    duration_ms: "submitted_at minus opened_at, milliseconds (includes idle time).",
    correct: "Objective items correct (0–8). Ordering and labeling are all-or-nothing.",
    max_score: "Number of objective items (8).",
    scoring_version: "Objective scoring version.",
    rubric_version: "Written-response rubric version (immediate and plus_60m only).",
  },
  item_responses: {
    attempt_id: ID,
    session_id: ID,
    timepoint: "Assessment timepoint.",
    form_key: "Form A, B or C.",
    form_version: "Question bank version.",
    item_id: "Item identifier, e.g. B-5. See items in codebook.json.",
    response: "MCQ: option index. Ordering: step indices by position. Labeling: option index per marker.",
    auto_score: "1 if correct under the frozen key, otherwise 0.",
    item_type: "mcq, ordering or labeling.",
    skill: "recall, sequencing, labeling, conceptual or transfer.",
    objective_id: "Learning objective (LO1–LO5; labeling covers LO1-LO4).",
    item_version: "Item version.",
    submitted_at: "Server UTC submission time.",
  },
  written_responses: {
    attempt_id: ID,
    session_id: ID,
    timepoint: "immediate or plus_60m.",
    response_kind: "free_recall or scenario.",
    rubric_version: "Rubric version applicable to the response.",
    response_text: "Verbatim participant text. Review for self-disclosed identifying details before sharing.",
    char_count: "Character count.",
  },
  free_recall_ratings: {
    attempt_id: ID,
    response_kind: "free_recall (max 10) or scenario (max 4).",
    rater_code: "Pseudonymous rater code (R-…); not the account identity.",
    rubric_version: "Rubric version used.",
    sub_scores: "Per-criterion 0/1/2 scores (JSON).",
    total_score: "Sum of sub-scores.",
    rated_at: "Server UTC rating time.",
  },
  rating_adjudications: {
    attempt_id: ID,
    response_kind: "free_recall or scenario.",
    rubric_version: "Rubric version.",
    adjudicator_code: "Pseudonymous adjudicator code.",
    sub_scores: "Agreed per-criterion scores (JSON).",
    total_score: "Agreed total.",
    resolved_at: "Server UTC resolution time.",
  },
  surveys: {
    session_id: ID,
    form_key: "F3 immediate experience or F5 one-hour survey.",
    form_version: "Questionnaire version.",
    answers_json: "Validated answers; see surveys in codebook.json.",
    submitted_at: "Server UTC submission time.",
  },
  followup_status: {
    session_id: ID,
    timepoint: "plus_60m.",
    due_at: "Server UTC: lesson_completed_at + 60 minutes.",
    deadline_at: "due_at + frozen grace window.",
    status: "not_started, completed_in_window, expired or withdrawn.",
    completed_at: "Server UTC completion time.",
  },
  events: {
    session_id: ID,
    event_type: "Allowlisted telemetry event name.",
    segment_id: "Lesson chapter, when applicable.",
    elapsed_ms: "Client monotonic elapsed time.",
    client_time: "Client-reported time (not authoritative).",
    server_received_at: "Server UTC receipt time.",
    payload: "Allowlisted event payload (JSON).",
  },
};
export function codebook() {
  const forms = (["A", "B", "C"] as const).map((form) => ({
    form,
    timepoint: { A: "pre", B: "immediate", C: "plus_60m" }[form],
    items: questionBanks[form].map((q) => ({
      ...q,
      key: answerKey(form)[q.id],
      scoring:
        q.type === "ordering"
          ? "Correct if the chosen order is any rotation of correctCycle."
          : q.type === "labeling"
            ? "Correct only if every marker is labeled correctly."
            : "Correct if the chosen option index equals correctAnswer.",
    })),
  }));
  return {
    title: "VisualLearn E1 codebook",
    status: "DRAFT — instruments and rubrics await supervisor/educator review. Not a validated scale.",
    bankVersion: BANK_VERSION,
    surveyVersion: SURVEY_VERSION,
    forms,
    writtenPrompts,
    rubrics,
    surveys: {
      F3: {
        likert: "1 Strongly disagree … 5 Strongly agree; audio, motion and color allow not_applicable.",
        items: f3Items.map(([key, text]) => ({ key, text })),
        mentalEffort: "Single item, 1 very little … 9 very much. Analyse separately; do not sum with Likert items.",
        optionalText: ["confusing", "helpful"],
      },
      F5: {
        reviewed: ["yes", "no", "unsure"],
        sources: f5Sources.map(([value, label]) => ({ value, label })),
        sourcesRule: "Only recorded when reviewed = yes.",
        discussed: ["yes", "no", "prefer_not_to_say"],
        confidence: "1 not at all … 5 extremely",
        recallEffort: "1 very little … 9 very much",
        optionalText: ["issues"],
      },
    },
    datasets: dataDictionary,
    exclusions: "Withdrawn participants are excluded from every export.",
  };
}
export function dataDictionaryMarkdown() {
  const lines = [
    "# VisualLearn export data dictionary",
    "",
    "Draft instruments. Withdrawn participants are excluded from every file. Free text needs disclosure review before sharing.",
  ];
  for (const [name, columns] of Object.entries(dataDictionary)) {
    lines.push("", `## ${name}.csv`, "", "| Column | Description |", "|---|---|");
    for (const [col, text] of Object.entries(columns))
      lines.push(`| ${col} | ${text.replaceAll("|", "\\|")} |`);
  }
  return lines.join("\n") + "\n";
}
