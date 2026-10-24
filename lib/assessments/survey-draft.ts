import { z } from "zod";
import {
  f3Items,
  f3Schema,
  f3ModalitySchema,
  f5Base,
  f5Schema,
} from "./surveys";
// Questionnaire drafts mirror assessment drafts: tab-scoped, validated against
// the current instrument and cleared only after the server accepts them.
export type SurveyFormKey = "F3" | "F5" | "F6";
export type SurveyValue = string | number | string[];
export type SurveyDraft = Record<string, SurveyValue>;
const shapes = {
  F3: f3Schema.shape,
  F5: f5Base.shape,
  F6: f5Base.shape,
} as const;
/** Required fields in display order, for progress and first-missing focus. */
export const surveyRequired: Record<SurveyFormKey, string[]> = {
  F3: [...f3Items.map(([key]) => key), "mentalEffort"],
  F5: ["reviewed", "sources", "discussed", "confidence", "recallEffort"],
  F6: ["reviewed", "sources", "discussed", "confidence", "recallEffort"],
};
const textFields: Record<SurveyFormKey, string[]> = {
  F3: ["confusing", "helpful"],
  F5: ["issues"],
  F6: ["issues"],
};
export function readSurveyDraft(
  raw: string | null,
  form: SurveyFormKey,
  diagramNA = false,
): SurveyDraft {
  try {
    const parsed = z
      .record(z.string(), z.unknown())
      .parse(JSON.parse(raw || "null"));
    const shape: Record<string, z.ZodType> =
      form === "F3" && diagramNA ? f3ModalitySchema.shape : shapes[form];
    return Object.fromEntries(
      Object.entries(parsed).filter(
        ([key, value]) =>
          Object.hasOwn(shape, key) && shape[key].safeParse(value).success,
      ),
    ) as SurveyDraft;
  } catch {
    return {};
  }
}
/** Sources only apply when review is reported; other answers drop them. */
export function surveySubmission(form: SurveyFormKey, draft: SurveyDraft) {
  const data: SurveyDraft = { ...draft };
  for (const key of textFields[form]) data[key] = String(data[key] ?? "");
  if (form !== "F3") {
    data.sources = data.reviewed === "yes" ? (data.sources ?? []) : [];
  }
  return data;
}
export function answeredCount(form: SurveyFormKey, draft: SurveyDraft) {
  return surveyRequired[form].filter((key) =>
    key === "sources"
      ? draft.reviewed !== undefined &&
        (draft.reviewed !== "yes" ||
          (Array.isArray(draft.sources) && draft.sources.length > 0))
      : draft[key] !== undefined,
  ).length;
}
export function validateSurveyDraft(
  form: SurveyFormKey,
  draft: SurveyDraft,
  diagramNA = false,
) {
  const result = (
    form === "F3" ? (diagramNA ? f3ModalitySchema : f3Schema) : f5Schema
  ).safeParse(surveySubmission(form, draft));
  if (result.success) return null;
  const order = surveyRequired[form];
  const fields = result.error.issues.map((i) => String(i.path[0] ?? ""));
  // Zod skips the F5 refinement until base fields parse; report it in order.
  if (
    form !== "F3" &&
    draft.reviewed === "yes" &&
    !(Array.isArray(draft.sources) && draft.sources.length)
  )
    fields.push("sources");
  const first =
    order.find((key) => fields.includes(key)) ?? fields[0] ?? order[0];
  const missing = order.length - answeredCount(form, draft);
  return {
    field: first,
    message:
      first === "sources" && draft.reviewed === "yes"
        ? "Choose at least one source, because you reported reviewing the topic."
        : missing > 0
          ? `Answer ${missing} remaining question${missing === 1 ? "" : "s"} before submitting.`
          : "Please check the highlighted answer.",
  };
}
