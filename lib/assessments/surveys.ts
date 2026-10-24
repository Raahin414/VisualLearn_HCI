import { z } from "zod";
// F5 v2 requires an explicit "discussed" answer instead of a preselected "No".
export const SURVEY_VERSION = "2.0.0-draft";
const likert = z.number().int().min(1).max(5);
const optionalLikert = z.union([likert, z.literal("not_applicable")]);
export const f3Schema = z
  .object({
    clarity: likert,
    overload: likert,
    support: likert,
    distraction: likert,
    pacing: likert,
    audio: optionalLikert,
    motion: optionalLikert,
    color: optionalLikert,
    acceptability: likert,
    mentalEffort: z.number().int().min(1).max(9),
    confusing: z.string().max(2000).optional(),
    helpful: z.string().max(2000).optional(),
  })
  .strict();
// Same wording/scale, with an explicit N/A choice for diagram support in E2.
// No default answer is selected. This is a separate draft instrument version.
export const MODALITY_SURVEY_VERSION = "2.1-modality-draft";
export const f3ModalitySchema = f3Schema.extend({ support: optionalLikert });
export const f5Sources = [
  ["this_website", "This website"],
  ["notes", "Notes"],
  ["another_website_or_video", "Another website or video"],
  ["discussion", "Discussion with someone"],
  ["other", "Other"],
  ["prefer_not_to_say", "Prefer not to say"],
] as const;
export const f5Base = z
  .object({
    reviewed: z.enum(["yes", "no", "unsure"]),
    sources: z
      .array(
        z.enum([
          "this_website",
          "notes",
          "another_website_or_video",
          "discussion",
          "other",
          "prefer_not_to_say",
        ]),
      )
      .max(6),
    discussed: z.enum(["yes", "no", "prefer_not_to_say"]),
    confidence: likert,
    recallEffort: z.number().int().min(1).max(9),
    issues: z.string().max(2000).optional(),
  })
  .strict();
export const f5Schema = f5Base.refine(
  (x) => x.reviewed !== "yes" || x.sources.length > 0,
  {
    message: "Choose a source when review is reported.",
    path: ["sources"],
  },
);
export const f3Items = [
  ["clarity", "The lesson was easy to follow."],
  ["overload", "There was too much information on the screen at once."],
  ["support", "The diagrams or pictures helped me understand the lesson."],
  [
    "distraction",
    "I found it difficult to concentrate on the important parts.",
  ],
  ["pacing", "The pace of the lesson was comfortable."],
  ["audio", "The audio, if provided, helped me learn."],
  ["motion", "The moving elements, if present, helped explain the topic."],
  ["color", "The colors made important information easy to find."],
  [
    "acceptability",
    "I would be willing to learn another topic using this interface.",
  ],
] as const;
