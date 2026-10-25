import "server-only";
import type { Presentation, DemoExperiment } from "./presentation";
import { conditions } from "@/lib/content/lesson";
export const DENSITY_VERSION = "density-v6-e1-draft";
export const SOURCE_VERSION = "e1-v8-draft";
/** Only the saved projection crosses into the participant screen. */
export function presentationFor(
  experiment: string,
  arm: string | null,
): Presentation {
  if (
    experiment === "E1" &&
    conditions.includes(arm as (typeof conditions)[number])
  )
    return {
      kind: "density",
      version: DENSITY_VERSION,
      density: arm as (typeof conditions)[number],
    };
  throw new Error(
    "This application supports the E1 visual-density study only.",
  );
}
/** Development only; participants cannot choose their density. */
export function demoExperiments(): DemoExperiment[] {
  return [
    {
      id: "E1",
      name: "Visual density",
      arms: conditions.map((key) => ({
        key,
        label: key,
        presentation: presentationFor("E1", key),
      })),
    },
  ];
}
