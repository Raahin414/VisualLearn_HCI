import "server-only";
import { z } from "zod";
import type { LabelSlot, PublicQuestion } from "./draft";
import { SEVEN_DAY_VERSION } from "./seven-day";
export const BANK_VERSION = "2.0.0-draft";
export type Skill =
  | "recall"
  | "sequencing"
  | "labeling"
  | "conceptual"
  | "transfer";
type Base = {
  id: string;
  form: "A" | "B" | "C" | "D" | "P";
  objectiveId: string;
  skill: Skill;
  stem: string;
  rationale: string;
  estimatedDifficulty: "basic" | "application";
  reviewStatus: "draft";
  version: string;
};
export type McqQuestion = Base & {
  type: "mcq";
  options: string[];
  correctAnswer: number;
};
/** Accepts any rotation of `correctCycle`: a cycle has no single start. */
export type OrderingQuestion = Base & {
  type: "ordering";
  steps: string[];
  correctCycle: number[];
};
export type LabelingQuestion = Base & {
  type: "labeling";
  markers: { slot: LabelSlot; description: string }[];
  options: string[];
  correctLabels: number[];
};
export type Question = McqQuestion | OrderingQuestion | LabelingQuestion;
type Meta = Pick<Base, "objectiveId" | "skill" | "rationale"> & {
  difficulty?: Base["estimatedDifficulty"];
};
const meta = (form: Base["form"], n: number, m: Meta) => ({
  id: `${form}-${n}`,
  form,
  objectiveId: m.objectiveId,
  skill: m.skill,
  rationale: m.rationale,
  estimatedDifficulty:
    m.difficulty ??
    (m.skill === "recall" ? ("basic" as const) : ("application" as const)),
  reviewStatus: "draft" as const,
  version: form === "D" ? SEVEN_DAY_VERSION : BANK_VERSION,
});
const mcq = (
  form: Base["form"],
  n: number,
  stem: string,
  options: string[],
  correctAnswer: number,
  m: Meta,
): McqQuestion => ({
  ...meta(form, n, m),
  type: "mcq",
  stem,
  options,
  correctAnswer,
});
const ORDER_STEM =
  "Put these in order to show one complete trip around the water cycle. Any starting point is accepted if the order is correct.";
const ordering = (
  form: Base["form"],
  n: number,
  steps: string[],
  correctCycle: number[],
): OrderingQuestion => ({
  ...meta(form, n, {
    objectiveId: "LO5",
    skill: "sequencing",
    rationale:
      "Evaporation, condensation, precipitation and collection repeat in that order; the cycle has no fixed start.",
  }),
  type: "ordering",
  stem: ORDER_STEM,
  steps,
  correctCycle,
});
// One neutral, condition-independent diagram. Slot keys are positions, not answers.
const slotText: Record<LabelSlot, string> = {
  s1: "wavy arrows rising from the lake surface",
  s2: "a cloud high above the hill",
  s3: "drops falling from the cloud toward the hill",
  s4: "water flowing down the hillside into the lake",
  s5: "arrows pointing down into the soil",
};
export const LABEL_OPTIONS = [
  "Evaporation",
  "Condensation",
  "Precipitation",
  "Runoff",
  "Infiltration",
];
const SLOT_ANSWER: Record<LabelSlot, number> = {
  s1: 0,
  s2: 1,
  s3: 2,
  s4: 3,
  s5: 4,
};
const labeling = (
  form: Base["form"],
  n: number,
  slots: LabelSlot[],
): LabelingQuestion => ({
  ...meta(form, n, {
    objectiveId: "LO1-LO4",
    skill: "labeling",
    rationale:
      "Rising vapor is evaporation, cloud formation is condensation, falling drops are precipitation and downhill surface flow is runoff.",
  }),
  type: "labeling",
  stem: "Label each numbered marker on the diagram with the process it shows. One process in the list is not used.",
  markers: slots.map((slot, i) => ({
    slot,
    description: `Marker ${i + 1}: ${slotText[slot]}`,
  })),
  options: LABEL_OPTIONS,
  correctLabels: slots.map((slot) => SLOT_ANSWER[slot]),
});
/**
 * Parallel blueprint shared by forms A, B and C (validated in tests):
 * 1–4 recall LO1–LO4 · 5 ordering LO5 · 6 diagram labeling LO1–LO4 ·
 * 7 conceptual LO2 · 8 transfer LO4. Forms B and C add a written evaporation
 * scenario and free recall, rated with server-only rubrics.
 */
export const questionBanks = {
  // Separate practice bank: public score feedback must never act as an oracle
  // for the locked A/B/C research item keys.
  P: [
    mcq(
      "P",
      1,
      "Which observation shows evaporation at a liquid surface?",
      ["A wet path drying", "Rain falling", "A stream flowing", "Ice collecting on a roof"],
      0,
      { objectiveId: "LO1", skill: "recall", rationale: "Liquid water leaves the path as vapor." },
    ),
    mcq(
      "P",
      2,
      "A cloud’s visible liquid parts are mostly what?",
      ["Invisible vapor alone", "Tiny droplets", "Dry dust alone", "Sunlight"],
      1,
      { objectiveId: "LO2", skill: "recall", rationale: "Clouds contain droplets and sometimes ice crystals." },
    ),
    mcq(
      "P",
      3,
      "Hail returning water to the ground belongs to which process?",
      ["Runoff", "Evaporation", "Precipitation", "Infiltration"],
      2,
      { objectiveId: "LO3", skill: "recall", rationale: "Hail is a form of precipitation." },
    ),
    mcq(
      "P",
      4,
      "Water gathering in an ocean is an example of what?",
      ["Condensation", "Boiling", "Water disappearing", "Collection"],
      3,
      { objectiveId: "LO4", skill: "recall", rationale: "Collection describes water gathering in a store." },
    ),
    mcq(
      "P",
      5,
      "What helps water flow downhill after rainfall?",
      ["Gravity", "Light from clouds", "Evaporation alone", "The water’s color"],
      0,
      { objectiveId: "LO4", skill: "conceptual", rationale: "Gravity helps move runoff downhill." },
    ),
    mcq(
      "P",
      6,
      "Which statement about evaporation is accurate?",
      ["It only occurs in oceans", "It can happen without boiling", "It creates rain immediately", "It turns water into soil"],
      1,
      { objectiveId: "LO1", skill: "conceptual", rationale: "Water can evaporate below its boiling point." },
    ),
    mcq(
      "P",
      7,
      "What happens to the state of water during condensation?",
      ["Liquid becomes solid", "Solid becomes vapor", "Vapor becomes liquid", "Water becomes energy"],
      2,
      { objectiveId: "LO2", skill: "conceptual", rationale: "Condensation is a gas-to-liquid transition." },
    ),
    mcq(
      "P",
      8,
      "Why is a cycle diagram a simplified model?",
      ["Water has a final destination", "All routes take the same time", "There is only one water store", "Real water follows many possible routes"],
      3,
      { objectiveId: "LO5", skill: "transfer", rationale: "Many stores and pathways connect the real water cycle." },
    ),
  ],
  A: [
    mcq(
      "A",
      1,
      "When liquid water evaporates, what does it become?",
      ["Tiny pieces of soil", "Water vapor", "Sunlight", "Salt"],
      1,
      { objectiveId: "LO1", skill: "recall", rationale: "Evaporation is the change from liquid water to water vapor." },
    ),
    mcq(
      "A",
      2,
      "What is the change from water vapor to liquid droplets called?",
      ["Runoff", "Melting", "Condensation", "Collection"],
      2,
      { objectiveId: "LO2", skill: "recall", rationale: "Condensation changes water vapor to liquid water." },
    ),
    mcq(
      "A",
      3,
      "Which example is precipitation?",
      ["Rain falling from a cloud", "A river flowing downhill", "Water soaking into soil", "Water warming in a bowl"],
      0,
      { objectiveId: "LO3", skill: "recall", rationale: "Rain falling from clouds is precipitation." },
    ),
    mcq(
      "A",
      4,
      "What can happen when rainwater reaches soil?",
      ["It must immediately evaporate", "It stops being water", "It always stays on the surface", "It can soak into the ground"],
      3,
      { objectiveId: "LO4", skill: "recall", rationale: "Water can infiltrate the ground." },
    ),
    ordering(
      "A",
      5,
      ["Precipitation", "Evaporation", "Collection", "Condensation"],
      [1, 3, 0, 2],
    ),
    labeling("A", 6, ["s3", "s1", "s4", "s2"]),
    mcq(
      "A",
      7,
      "Where can droplets outside a cold glass come from?",
      ["Water vapor in the surrounding air", "Water moving through solid glass", "New water created by the glass", "The color of the drink"],
      0,
      { objectiveId: "LO2", skill: "conceptual", rationale: "Surrounding water vapor cools and condenses." },
    ),
    mcq(
      "A",
      8,
      "Heavy rain falls on a steep paved parking lot. Where is much of the water likely to go first?",
      ["Deep into the solid pavement", "Across the surface toward drains or streams", "Straight back up into a cloud", "Nowhere, because it turns into hail"],
      1,
      { objectiveId: "LO4", skill: "transfer", rationale: "Water that cannot soak in flows over the surface as runoff." },
    ),
  ],
  B: [
    mcq(
      "B",
      1,
      "Which process changes liquid water into invisible water vapor?",
      ["Condensation", "Evaporation", "Precipitation", "Infiltration"],
      1,
      { objectiveId: "LO1", skill: "recall", rationale: "Liquid water changes to vapor during evaporation." },
    ),
    mcq(
      "B",
      2,
      "Moist air cools and tiny droplets form. What change has occurred?",
      ["Collection", "Runoff", "Evaporation", "Condensation"],
      3,
      { objectiveId: "LO2", skill: "recall", rationale: "Cooling moist air can lead to condensation." },
    ),
    mcq(
      "B",
      3,
      "Which pair contains two forms of precipitation?",
      ["Rain and snow", "Runoff and rain", "Clouds and water vapor", "Soil water and river water"],
      0,
      { objectiveId: "LO3", skill: "recall", rationale: "Rain and snow are water falling from clouds." },
    ),
    mcq(
      "B",
      4,
      "Rain flows down a hill into a stream. What is this surface movement called?",
      ["Condensation", "Evaporation", "Runoff", "Freezing"],
      2,
      { objectiveId: "LO4", skill: "recall", rationale: "Runoff is water flowing over the land surface." },
    ),
    ordering(
      "B",
      5,
      [
        "Droplets grow heavy and fall as rain",
        "Rainwater gathers in the lake",
        "Cooling water vapor forms cloud droplets",
        "Sunlight warms the lake and some water evaporates",
      ],
      [3, 2, 0, 1],
    ),
    labeling("B", 6, ["s2", "s4", "s1", "s3"]),
    mcq(
      "B",
      7,
      "A sealed bottle is cold on a warm day. Why might drops appear on its outside?",
      ["The bottle creates water", "Liquid escapes through intact glass", "The label produces vapor", "Water vapor in nearby air condenses"],
      3,
      { objectiveId: "LO2", skill: "conceptual", rationale: "The water comes from surrounding air, not through the bottle." },
    ),
    mcq(
      "B",
      8,
      "After heavy rain on a hard, dry hillside, a nearby stream rises quickly. What best explains this?",
      ["Water vapor condensed inside the stream", "Rainwater ran over the surface into the stream", "The stream water evaporated faster", "Sunlight created extra water"],
      1,
      { objectiveId: "LO4", skill: "transfer", rationale: "Water that cannot soak in runs off into streams." },
    ),
  ],
  C: [
    mcq(
      "C",
      1,
      "Sunlight warms a shallow bowl of water. How can some of the water enter the air?",
      ["By evaporation", "Only by boiling", "By runoff upward", "By changing into light"],
      0,
      { objectiveId: "LO1", skill: "recall", rationale: "Evaporation occurs at a liquid surface without boiling." },
    ),
    mcq(
      "C",
      2,
      "Which process forms the tiny liquid droplets in a cloud?",
      ["Evaporation", "Infiltration", "Condensation", "Runoff"],
      2,
      { objectiveId: "LO2", skill: "recall", rationale: "Water vapor condenses into droplets as moist air cools." },
    ),
    mcq(
      "C",
      3,
      "Snow falling from a cloud is an example of which process?",
      ["Infiltration", "Condensation", "Precipitation", "Evaporation"],
      2,
      { objectiveId: "LO3", skill: "recall", rationale: "Snow is one form of precipitation." },
    ),
    mcq(
      "C",
      4,
      "After a storm, water enters spaces in the soil. What is this called?",
      ["Evaporation", "Condensation", "Precipitation", "Infiltration"],
      3,
      { objectiveId: "LO4", skill: "recall", rationale: "Infiltration is water soaking into the ground." },
    ),
    ordering(
      "C",
      5,
      [
        "Water vapor cools high above the ocean",
        "Snow falls onto a mountain",
        "Sunlight warms the ocean and some water evaporates",
        "Meltwater flows downhill and gathers in the ocean",
      ],
      [2, 0, 1, 3],
    ),
    labeling("C", 6, ["s4", "s3", "s2", "s1"]),
    mcq(
      "C",
      7,
      "A chilled metal lid becomes wet on the outside. What is the best explanation?",
      ["Rain moves through the metal", "Water vapor in nearby air condenses", "The metal changes into liquid", "The lid creates new water"],
      1,
      { objectiveId: "LO2", skill: "conceptual", rationale: "Water vapor can cool and condense on the outside." },
    ),
    mcq(
      "C",
      8,
      "Rain reaches a grassy slope above a river. Which outcome is possible?",
      ["Every drop instantly becomes snow", "The water must stop moving", "Some may run downhill to the river and some may soak in", "The water can never evaporate again"],
      2,
      { objectiveId: "LO4", skill: "transfer", rationale: "Water may run off, infiltrate, collect, or later evaporate." },
    ),
  ],
  D: [
    mcq(
      "D",
      1,
      "A pond loses some liquid water to the air on a warm afternoon. What is that change called?",
      ["Runoff", "Precipitation", "Evaporation", "Condensation"],
      2,
      {
        objectiveId: "LO1",
        skill: "recall",
        rationale:
          "Evaporation changes liquid water at the pond surface into vapor.",
      },
    ),
    mcq(
      "D",
      2,
      "Water vapor cools and becomes tiny liquid drops. Which process describes this?",
      ["Condensation", "Collection", "Infiltration", "Evaporation"],
      0,
      {
        objectiveId: "LO2",
        skill: "recall",
        rationale:
          "Condensation is the change from water vapor to liquid droplets.",
      },
    ),
    mcq(
      "D",
      3,
      "Hail falls from a cloud onto a field. Which part of the water cycle is this?",
      ["Evaporation", "Runoff", "Condensation", "Precipitation"],
      3,
      {
        objectiveId: "LO3",
        skill: "recall",
        rationale: "Hail falling from clouds is precipitation.",
      },
    ),
    mcq(
      "D",
      4,
      "Water from a shower of rain gathers in a lake. Which term describes water gathering there?",
      ["Condensation", "Collection", "Evaporation", "Boiling"],
      1,
      {
        objectiveId: "LO4",
        skill: "recall",
        rationale:
          "Collection describes water gathering in a store such as a lake.",
      },
    ),
    ordering(
      "D",
      5,
      [
        "Rainwater flows into a pond",
        "Vapor cools and forms cloud droplets",
        "Water from the pond evaporates in the Sun's warmth",
        "Water falls from the cloud as rain",
      ],
      [2, 1, 3, 0],
    ),
    labeling("D", 6, ["s3", "s1", "s4", "s2"]),
    mcq(
      "D",
      7,
      "A cold window develops water drops on the side facing warm moist air. Where did the drops come from?",
      [
        "Water was created by the glass",
        "Water vapor in the air cooled into liquid",
        "Rain traveled through the glass",
        "The window turned into water",
      ],
      1,
      {
        objectiveId: "LO2",
        skill: "conceptual",
        rationale:
          "Nearby water vapor cools at the cold surface and condenses.",
      },
    ),
    mcq(
      "D",
      8,
      "Rain falls on a slope beside a pond. Which description allows the water cycle to continue?",
      [
        "The water can run into the pond or soak into the soil and later move again",
        "All water must stay exactly where it lands",
        "Rainwater cannot enter the air again",
        "Only water in clouds can move",
      ],
      0,
      {
        objectiveId: "LO4",
        skill: "transfer",
        rationale:
          "Runoff, infiltration, collection and later evaporation allow water to keep moving.",
      },
    ),
  ],
} satisfies Record<Base["form"], Question[]>;
export type Form = keyof typeof questionBanks;
export function publicQuestions(form: Form): PublicQuestion[] {
  return questionBanks[form].map((q): PublicQuestion => {
    const base = {
      id: q.id,
      form: q.form,
      objectiveId: q.objectiveId,
      skill: q.skill,
      stem: q.stem,
    };
    if (q.type === "ordering") return { ...base, type: "ordering", steps: q.steps };
    if (q.type === "labeling")
      return { ...base, type: "labeling", markers: q.markers, options: q.options };
    return { ...base, type: "mcq", options: q.options };
  });
}
export const responseSchema = z.record(
  z.string().max(32),
  z.union([
    z.number().int().min(0).max(7),
    z.array(z.number().int().min(0).max(7)).min(2).max(8),
  ]),
);
const rotations = (cycle: number[]) =>
  cycle.map((_, i) => [...cycle.slice(i), ...cycle.slice(0, i)].join(","));
function wellFormed(q: Question, value: unknown) {
  if (q.type === "mcq")
    return typeof value === "number" && value < q.options.length;
  if (!Array.isArray(value)) return false;
  if (q.type === "ordering")
    return (
      value.length === q.steps.length &&
      new Set(value).size === value.length &&
      value.every((v) => v < q.steps.length)
    );
  return (
    value.length === q.markers.length &&
    value.every((v) => v < q.options.length)
  );
}
export function isCorrect(q: Question, value: unknown) {
  if (q.type === "mcq") return value === q.correctAnswer;
  if (!Array.isArray(value)) return false;
  if (q.type === "ordering")
    return rotations(q.correctCycle).includes(value.join(","));
  return value.join(",") === q.correctLabels.join(",");
}
/** Server-side scoring: one point per item; ordering/labeling are all-or-nothing. */
export function scoreAnswers(form: Form, input: unknown) {
  const answers = responseSchema.parse(input);
  const bank: Question[] = questionBanks[form];
  if (
    Object.keys(answers).length !== bank.length ||
    bank.some((q) => !wellFormed(q, answers[q.id]))
  )
    throw new Error("Answer every question using the supplied form.");
  const itemScores = Object.fromEntries(
    bank.map((q) => [q.id, isCorrect(q, answers[q.id]) ? 1 : 0]),
  );
  return {
    correct: Object.values(itemScores).reduce((a, b) => a + b, 0),
    total: bank.length,
    itemScores,
  };
}
/** Key for test fixtures and the reviewer packet; never sent to learners. */
export function answerKey(form: Form) {
  return Object.fromEntries(
    questionBanks[form].map((q: Question) => [
      q.id,
      q.type === "mcq"
        ? q.correctAnswer
        : q.type === "ordering"
          ? q.correctCycle
          : q.correctLabels,
    ]),
  );
}
