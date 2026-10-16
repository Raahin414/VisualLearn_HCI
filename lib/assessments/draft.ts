import { z } from "zod";
export type PublicQuestion = { id: string; stem: string; options: string[] };
export type AssessmentDraft = {
  answers: Record<string, number>;
  freeRecall: string;
};
export const emptyDraft = (): AssessmentDraft => ({
  answers: {},
  freeRecall: "",
});
const schema = z
  .object({
    answers: z.record(z.string(), z.number().int().nonnegative()),
    freeRecall: z.string().max(6000),
  })
  .strict();
export function readDraft(
  raw: string | null,
  questions: PublicQuestion[],
): AssessmentDraft {
  try {
    const draft = schema.parse(JSON.parse(raw || "null"));
    const allowed = new Map(questions.map((q) => [q.id, q.options.length]));
    return {
      answers: Object.fromEntries(
        Object.entries(draft.answers).filter(
          ([id, index]) => allowed.has(id) && index < allowed.get(id)!,
        ),
      ),
      freeRecall: draft.freeRecall,
    };
  } catch {
    return emptyDraft();
  }
}
export function validateDraft(
  draft: AssessmentDraft,
  questions: PublicQuestion[],
  recallRequired = false,
) {
  const missing = questions.filter(
    (q) =>
      !Number.isInteger(draft.answers[q.id]) ||
      draft.answers[q.id] < 0 ||
      draft.answers[q.id] >= q.options.length,
  );
  if (missing.length)
    return {
      message: `Answer ${missing.length} remaining question${missing.length === 1 ? "" : "s"} before submitting.`,
      questionId: missing[0].id,
    };
  if (recallRequired && draft.freeRecall.trim().length < 20)
    return {
      message: "Please write at least 20 characters for your explanation.",
      questionId: "freeRecall",
    };
  if (draft.freeRecall.length > 6000)
    return {
      message: "Keep your explanation within 6,000 characters.",
      questionId: "freeRecall",
    };
  return null;
}
