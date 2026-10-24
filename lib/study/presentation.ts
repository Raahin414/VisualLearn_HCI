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
]);
export type Presentation = z.infer<typeof presentationSchema>;
export type DemoExperiment = {
  id: "E1" | "E2";
  name: string;
  arms: { key: string; label: string; presentation: Presentation }[];
};
