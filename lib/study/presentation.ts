import { z } from "zod";
export const presentationSchema = z
  .object({
    kind: z.literal("density"),
    version: z.string(),
    density: z.enum(["low", "medium", "high"]),
  })
  .strict();
export type Presentation = z.infer<typeof presentationSchema>;
export type DemoExperiment = {
  id: "E1";
  name: string;
  arms: { key: string; label: string; presentation: Presentation }[];
};
export function visibleSegments(
  _presentation: Presentation | null,
  segment: number,
): number[] {
  return [segment];
}
