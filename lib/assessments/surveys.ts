import { z } from "zod";
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
export const f5Schema = z
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
  .strict()
  .refine((x) => x.reviewed !== "yes" || x.sources.length > 0, {
    message: "Choose a source when review is reported.",
    path: ["sources"],
  });
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
export const freeRecallRubric = {
  version: "1.0.0-draft",
  reviewStatus: "supervisor-review-required",
  criteria: [
    "Evaporation identified and explained",
    "Condensation identified and explained",
    "Precipitation identified and explained",
    "Collection/runoff identified and explained",
    "Causal connections and cyclicity",
  ],
  anchors: {
    0: "Missing or incorrect",
    1: "Partial or unclear",
    2: "Accurate",
  },
  maxScore: 10,
  spellingPenalty: false,
};
