import "server-only";
/** Server-only keys; public course definitions have no answers. */
export const courseAnswers: Record<string, readonly number[]> = {
  "water-cycle": [0, 1, 2, 3],
  photosynthesis: [1, 2, 0, 3],
  "electric-circuits": [0, 1, 2, 3],
  "human-digestion": [0, 1, 2, 3],
  "solar-system": [0, 1, 2, 3],
};
