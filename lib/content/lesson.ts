import { z } from "zod";
import raw from "@/content/lessons/water-cycle/v1.json";
const segmentSchema = z.object({
  id: z.string(),
  heading: z.string(),
  shortTitle: z.string(),
  eyebrow: z.string(),
  objectiveIds: z.array(z.string()),
  durationSeconds: z.number().positive(),
  audioSrc: z.string(),
  body: z.string().min(300),
  keyIdea: z.string(),
  diagramDescription: z.string(),
});
export const lessonSchema = z.object({
  id: z.string(),
  version: z.string(),
  title: z.string(),
  language: z.string(),
  reviewStatus: z.string(),
  narrationMode: z.string(),
  learningObjectives: z.array(z.string()),
  segments: z.array(segmentSchema).min(4).max(6),
});
export const lesson = lessonSchema.parse(raw);
export type Segment = z.infer<typeof segmentSchema>;
export const conditions = ["low", "medium", "high"] as const;
export type Condition = (typeof conditions)[number];
export const densityConfig: Record<
  Condition,
  {
    supportive: boolean;
    decorative: boolean;
    supportingPanels: number;
    label: string;
  }
> = {
  low: {
    supportive: false,
    decorative: false,
    supportingPanels: 0,
    label: "Low",
  },
  medium: {
    supportive: true,
    decorative: false,
    supportingPanels: 2,
    label: "Medium",
  },
  high: {
    supportive: true,
    decorative: true,
    supportingPanels: 4,
    label: "High",
  },
};
