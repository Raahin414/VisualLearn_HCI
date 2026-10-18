import { z } from "zod";
// Learner-safe item projections. Keys, rationales and rubrics stay server-only.
type PublicBase = {
  id: string;
  stem: string;
  form?: string;
  objectiveId?: string;
  skill?: string;
};
export type PublicMcq = PublicBase & { type?: "mcq"; options: string[] };
export type PublicOrdering = PublicBase & { type: "ordering"; steps: string[] };
export type LabelSlot = "s1" | "s2" | "s3" | "s4" | "s5";
export type PublicLabeling = PublicBase & {
  type: "labeling";
  markers: { slot: LabelSlot; description: string }[];
  options: string[];
};
export type PublicQuestion = PublicMcq | PublicOrdering | PublicLabeling;
// Ordering/labeling drafts use -1 for a position that is not chosen yet.
export type Answer = number | number[];
export type AssessmentDraft = {
  answers: Record<string, Answer>;
  freeRecall: string;
  scenario: string;
  /** Written answers are locked before recognition items can cue them. */
  writtenDone?: boolean;
};
export const WRITTEN_MIN = 20;
export const RECALL_MAX = 6000;
export const SCENARIO_MAX = 3000;
export const emptyDraft = (): AssessmentDraft => ({
  answers: {},
  freeRecall: "",
  scenario: "",
});
const schema = z
  .object({
    answers: z.record(
      z.string(),
      z.union([
        z.number().int().nonnegative(),
        z.array(z.number().int().min(-1)).max(8),
      ]),
    ),
    freeRecall: z.string().max(RECALL_MAX),
    scenario: z.string().max(SCENARIO_MAX).optional(),
    writtenDone: z.boolean().optional(),
  })
  .strict();
/** Number of slots and valid choices for multi-part items; null for MCQ. */
export function itemShape(q: PublicQuestion) {
  if (q.type === "ordering")
    return { parts: q.steps.length, choices: q.steps.length };
  if (q.type === "labeling")
    return { parts: q.markers.length, choices: q.options.length };
  return null;
}
function fits(q: PublicQuestion, value: unknown) {
  const shape = itemShape(q);
  if (!shape)
    return (
      typeof value === "number" &&
      Number.isInteger(value) &&
      value >= 0 &&
      value < (q as PublicMcq).options.length
    );
  return (
    Array.isArray(value) &&
    value.length === shape.parts &&
    value.every((v) => Number.isInteger(v) && v >= -1 && v < shape.choices)
  );
}
/** Complete answer for submission: every part chosen; ordering uses each step once. */
export function isComplete(q: PublicQuestion, value: Answer | undefined) {
  if (value === undefined || !fits(q, value)) return false;
  if (!Array.isArray(value)) return true;
  if (value.some((v) => v < 0)) return false;
  return q.type !== "ordering" || new Set(value).size === value.length;
}
export function isStarted(value: Answer | undefined) {
  return Array.isArray(value) ? value.some((v) => v >= 0) : value !== undefined;
}
export function readDraft(
  raw: string | null,
  questions: PublicQuestion[],
): AssessmentDraft {
  try {
    const draft = schema.parse(JSON.parse(raw || "null"));
    const byId = new Map(questions.map((q) => [q.id, q]));
    return {
      answers: Object.fromEntries(
        Object.entries(draft.answers).filter(
          ([id, value]) => byId.has(id) && fits(byId.get(id)!, value),
        ),
      ),
      freeRecall: draft.freeRecall,
      scenario: draft.scenario ?? "",
      writtenDone: draft.writtenDone ?? false,
    };
  } catch {
    return emptyDraft();
  }
}
export function validateDraft(
  draft: AssessmentDraft,
  questions: PublicQuestion[],
  recallRequired = false,
  scenarioRequired = false,
) {
  const written = validateWritten(draft, recallRequired, scenarioRequired);
  if (written) return written;
  const missing = questions.filter((q) => !isComplete(q, draft.answers[q.id]));
  if (missing.length) {
    const first = missing[0];
    const partial =
      first.type === "ordering" && isStarted(draft.answers[first.id]);
    return {
      message:
        missing.length === 1 && partial
          ? "Use each step exactly once to complete the ordering question."
          : `Answer ${missing.length} remaining question${missing.length === 1 ? "" : "s"} before submitting.`,
      questionId: first.id,
    };
  }
  return null;
}
/** Written answers come first in the form, so they are validated on their own. */
export function validateWritten(
  draft: AssessmentDraft,
  recallRequired = false,
  scenarioRequired = false,
) {
  if (recallRequired && draft.freeRecall.trim().length < WRITTEN_MIN)
    return {
      message: `Please write at least ${WRITTEN_MIN} characters for your explanation.`,
      questionId: "freeRecall",
    };
  if (draft.freeRecall.length > RECALL_MAX)
    return {
      message: "Keep your explanation within 6,000 characters.",
      questionId: "freeRecall",
    };
  if (scenarioRequired && draft.scenario.trim().length < WRITTEN_MIN)
    return {
      message: `Please write at least ${WRITTEN_MIN} characters for the scenario explanation.`,
      questionId: "scenario",
    };
  if (draft.scenario.length > SCENARIO_MAX)
    return {
      message: "Keep your scenario explanation within 3,000 characters.",
      questionId: "scenario",
    };
  return null;
}
export const wordCount = (text: string) =>
  text.trim() ? text.trim().split(/\s+/).length : 0;
