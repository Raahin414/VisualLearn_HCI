// Learner-visible written prompts, versioned with the draft A/B/C forms.
// Rubrics and expected content are server-only in rubrics.server.ts.
export const WRITTEN_PROMPT_VERSION = "2.0.0-draft";
export const writtenPrompts = {
  pre: { freeRecall: null, scenario: null },
  immediate: {
    scenario:
      "Wet clothes dry faster outdoors on a sunny, breezy day. Which process helps explain this, and why do the sunshine and the breeze matter?",
    freeRecall:
      "Without looking back at the lesson, describe the water cycle in your own words. Include the processes you remember, what happens in each one, and how they connect.",
  },
  plus_60m: {
    scenario:
      "A wet towel left in a warm, windy place is dry an hour later, although no water dripped off it. Where did the water go, and why did the warm, windy conditions help?",
    freeRecall:
      "Without replaying the lesson, explain how water can move from a lake to a cloud and back to the ground. Name the processes you recall, what happens in each one, and how they connect.",
  },
} as const;
export type WrittenTimepoint = keyof typeof writtenPrompts;
