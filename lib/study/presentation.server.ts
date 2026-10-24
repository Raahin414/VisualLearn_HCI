import "server-only";
import type { Presentation, DemoExperiment } from "./presentation";
import { conditions } from "@/lib/content/lesson";
export const MODALITY_VERSION = "modality-v1-draft";
export const DENSITY_VERSION = "density-v5-draft";
export const CHUNKING_VERSION = "chunking-v1-draft";
export const SOURCE_VERSION = "shared-v6-draft";
const chunking = {
  chunked: [[0], [1], [2], [3], [4]],
  grouped: [
    [0, 1, 2],
    [3, 4],
  ],
  "all-at-once": [[0, 1, 2, 3, 4]],
};
// Assignment keys/configuration stay on the server. Learners receive only the
// rendering projection for their persisted assignment, never an arm selector.
const modality = {
  "text-only": { text: true, audio: false, diagram: false, label: "Text only" },
  "audio-only": {
    text: false,
    audio: true,
    diagram: false,
    label: "Audio only",
  },
  "text-diagram": {
    text: true,
    audio: false,
    diagram: true,
    label: "Text and diagram",
  },
  "audio-diagram": {
    text: false,
    audio: true,
    diagram: true,
    label: "Audio and diagram",
  },
} as const;
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
  if (experiment === "E2" && arm && Object.hasOwn(modality, arm)) {
    const { text, audio, diagram } = modality[arm as keyof typeof modality];
    return {
      kind: "modality",
      version: MODALITY_VERSION,
      text,
      audio,
      diagram,
    };
  }
  if (experiment === "E3" && arm && Object.hasOwn(chunking, arm))
    return {
      kind: "chunking",
      version: CHUNKING_VERSION,
      groups: chunking[arm as keyof typeof chunking].map((group) => [...group]),
    };
  throw new Error("Unsupported persisted study assignment");
}
/** Development page only; never serialize this catalogue to a research session. */
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
    {
      id: "E2",
      name: "Modality (draft pilot)",
      arms: Object.entries(modality).map(([key, config]) => ({
        key,
        label: config.label,
        presentation: presentationFor("E2", key),
      })),
    },
    {
      id: "E3",
      name: "Chunking (draft pilot)",
      arms: Object.keys(chunking).map((key) => ({
        key,
        label: key,
        presentation: presentationFor("E3", key),
      })),
    },
  ];
}
