import "server-only";
import { z } from "zod";
// Draft rubrics pending supervisor/educator review. Raters never see the
// participant's condition, age band or other rater scores while rating.
export const RUBRIC_VERSION = "2.0.0-draft";
type Criterion = { key: string; label: string; anchors: [string, string, string] };
const criterion = (key: string, label: string, partial: string, full: string) =>
  ({ key, label, anchors: ["Missing or incorrect", partial, full] }) as Criterion;
export const rubrics = {
  free_recall: {
    version: RUBRIC_VERSION,
    reviewStatus: "supervisor-review-required",
    maxScore: 10,
    spellingPenalty: false,
    criteria: [
      criterion("evaporation", "Evaporation", "Named, or described without the liquid-to-vapor change", "Liquid water changes to water vapor, e.g. with heat or the Sun"),
      criterion("condensation", "Condensation", "Named, or clouds/droplets mentioned without cooling or state change", "Water vapor cools and changes into droplets or clouds"),
      criterion("precipitation", "Precipitation", "Named, or rain mentioned without falling from clouds", "Water falls from clouds as rain, snow, sleet or hail"),
      criterion("collection", "Collection, runoff or infiltration", "Water reaching the ground mentioned without where it goes", "Water collects, runs off or soaks into the ground"),
      criterion("cycle", "Connections and cyclicity", "Some processes linked, or repetition stated without links", "Processes linked in a coherent order and the cycle repeats"),
    ],
  },
  scenario: {
    version: RUBRIC_VERSION,
    reviewStatus: "supervisor-review-required",
    maxScore: 4,
    spellingPenalty: false,
    criteria: [
      criterion("process", "Process", "Evaporation named without the change, or the change described without naming it", "Evaporation: liquid water changes to water vapor in the air"),
      criterion("conditions", "Conditions", "One condition explained, or both mentioned without a reason", "Warmth supplies energy and moving air carries vapor away, so drying is faster"),
    ],
  },
} as const;
export type ResponseKind = keyof typeof rubrics;
export const responseKinds = Object.keys(rubrics) as ResponseKind[];
export function ratingSchema(kind: ResponseKind) {
  const keys = rubrics[kind].criteria.map((c) => c.key);
  return z
    .object(
      Object.fromEntries(keys.map((k) => [k, z.number().int().min(0).max(2)])),
    )
    .strict();
}
/** Client-safe rubric view for the protected rater screen only. */
export function rubricForRaters(kind: ResponseKind) {
  const r = rubrics[kind];
  return { kind, version: r.version, maxScore: r.maxScore, criteria: r.criteria };
}
