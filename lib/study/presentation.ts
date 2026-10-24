import { z } from "zod";
export const presentationSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("density"),
      version: z.string(),
      density: z.enum(["low", "medium", "high"]),
    })
    .strict(),
  z
    .object({
      kind: z.literal("modality"),
      version: z.string(),
      text: z.boolean(),
      audio: z.boolean(),
      diagram: z.boolean(),
    })
    .strict(),
  z
    .object({
      kind: z.literal("chunking"),
      version: z.string(),
      groups: z
        .array(z.array(z.number().int().min(0).max(4)).min(1).max(5))
        .min(1)
        .max(5),
    })
    .strict()
    .refine(
      (p) => p.groups.flat().join(",") === "0,1,2,3,4",
      "Groups must cover the canonical sequence exactly once.",
    ),
]);
export type Presentation = z.infer<typeof presentationSchema>;
export type DemoExperiment = {
  id: "E1" | "E2" | "E3";
  name: string;
  arms: { key: string; label: string; presentation: Presentation }[];
};
/** Only the assigned projection crosses the server boundary. */
export function visibleSegments(
  presentation: Presentation | null,
  segment: number,
): number[] {
  if (presentation?.kind !== "chunking") return [segment];
  const group = presentation.groups.find((indices) =>
    indices.includes(segment),
  );
  if (!group) throw new Error("Unknown concept in assigned presentation.");
  return group;
}
