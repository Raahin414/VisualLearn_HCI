import "server-only";
import { z } from "zod";
export type Question = {
  id: string;
  form: "A" | "B" | "C" | "P";
  type: "mcq";
  objectiveId: string;
  stem: string;
  options: string[];
  correctAnswer: number;
  rationale: string;
  estimatedDifficulty: "basic" | "application";
  reviewStatus: "draft";
  version: string;
};
const make = (
  form: Question["form"],
  items: [string, string[], number, string, string][],
): Question[] =>
  items.map(([stem, options, correctAnswer, objectiveId, rationale], i) => ({
    id: `${form}-${i + 1}`,
    form,
    type: "mcq",
    objectiveId,
    stem,
    options,
    correctAnswer,
    rationale,
    estimatedDifficulty: i > 5 ? "application" : "basic",
    reviewStatus: "draft",
    version: "1.0.0-draft",
  }));
export const questionBanks = {
  // Separate practice bank: public score feedback must never act as an oracle
  // for the locked A/B/C research item keys.
  P: make("P", [
    [
      "Which observation shows evaporation at a liquid surface?",
      [
        "A wet path drying",
        "Rain falling",
        "A stream flowing",
        "Ice collecting on a roof",
      ],
      0,
      "LO1",
      "Liquid water leaves the path as vapor.",
    ],
    [
      "A cloud’s visible liquid parts are mostly what?",
      ["Invisible vapor alone", "Tiny droplets", "Dry dust alone", "Sunlight"],
      1,
      "LO2",
      "Clouds contain droplets and sometimes ice crystals.",
    ],
    [
      "Hail returning water to the ground belongs to which process?",
      ["Runoff", "Evaporation", "Precipitation", "Infiltration"],
      2,
      "LO3",
      "Hail is a form of precipitation.",
    ],
    [
      "Water gathering in an ocean is an example of what?",
      ["Condensation", "Boiling", "Water disappearing", "Collection"],
      3,
      "LO4",
      "Collection describes water gathering in a store.",
    ],
    [
      "What helps water flow downhill after rainfall?",
      [
        "Gravity",
        "Light from clouds",
        "Evaporation alone",
        "The water’s color",
      ],
      0,
      "LO4",
      "Gravity helps move runoff downhill.",
    ],
    [
      "Which statement about evaporation is accurate?",
      [
        "It only occurs in oceans",
        "It can happen without boiling",
        "It creates rain immediately",
        "It turns water into soil",
      ],
      1,
      "LO1",
      "Water can evaporate below its boiling point.",
    ],
    [
      "What happens to the state of water during condensation?",
      [
        "Liquid becomes solid",
        "Solid becomes vapor",
        "Vapor becomes liquid",
        "Water becomes energy",
      ],
      2,
      "LO2",
      "Condensation is a gas-to-liquid transition.",
    ],
    [
      "Why is a cycle diagram a simplified model?",
      [
        "Water has a final destination",
        "All routes take the same time",
        "There is only one water store",
        "Real water follows many possible routes",
      ],
      3,
      "LO5",
      "Many stores and pathways connect the real water cycle.",
    ],
  ]),
  A: make("A", [
    [
      "When liquid water evaporates, what does it become?",
      ["Tiny pieces of soil", "Water vapor", "Sunlight", "Salt"],
      1,
      "LO1",
      "Evaporation is the change from liquid water to water vapor.",
    ],
    [
      "What is the change from water vapor to liquid droplets called?",
      ["Runoff", "Melting", "Condensation", "Collection"],
      2,
      "LO2",
      "Condensation changes water vapor to liquid water.",
    ],
    [
      "Which example is precipitation?",
      [
        "Rain falling from a cloud",
        "A river flowing downhill",
        "Water soaking into soil",
        "Water warming in a bowl",
      ],
      0,
      "LO3",
      "Rain falling from clouds is precipitation.",
    ],
    [
      "What can happen when rainwater reaches soil?",
      [
        "It must immediately evaporate",
        "It stops being water",
        "It always stays on the surface",
        "It can soak into the ground",
      ],
      3,
      "LO4",
      "Water can infiltrate the ground.",
    ],
    [
      "Which sequence shows one possible trip through the water cycle?",
      [
        "Rain → evaporation → collection → condensation",
        "Evaporation → condensation → precipitation → collection",
        "Condensation → evaporation → collection → precipitation",
        "Collection → precipitation → evaporation → condensation",
      ],
      1,
      "LO5",
      "This is one simplified coherent cycle; it has no unique starting point.",
    ],
    [
      "What supplies much of the energy for evaporation at Earth’s surface?",
      ["The Moon", "Soil", "The Sun", "Cloud droplets"],
      2,
      "LO1",
      "Solar energy drives much evaporation.",
    ],
    [
      "Where can droplets outside a cold glass come from?",
      [
        "Water vapor in the surrounding air",
        "Water moving through solid glass",
        "New water created by the glass",
        "The color of the drink",
      ],
      0,
      "LO2",
      "Surrounding water vapor cools and condenses.",
    ],
    [
      "A puddle shrinks without water flowing away. What is a likely explanation?",
      [
        "The water turned into rock",
        "The Sun absorbed all the liquid",
        "Gravity stopped working",
        "Some water evaporated",
      ],
      3,
      "LO1",
      "Water can leave a liquid surface as vapor.",
    ],
  ]),
  B: make("B", [
    [
      "Wet clothes dry in moving, warm air. Which process removes liquid water?",
      ["Condensation", "Evaporation", "Precipitation", "Infiltration"],
      1,
      "LO1",
      "Liquid water changes to vapor during evaporation.",
    ],
    [
      "Moist air cools and tiny droplets form. What change has occurred?",
      ["Collection", "Runoff", "Evaporation", "Condensation"],
      3,
      "LO2",
      "Cooling moist air can lead to condensation.",
    ],
    [
      "Which pair contains two forms of precipitation?",
      [
        "Rain and snow",
        "Runoff and rain",
        "Clouds and water vapor",
        "Soil water and river water",
      ],
      0,
      "LO3",
      "Rain and snow are water falling from clouds.",
    ],
    [
      "Rain flows down a hill into a stream. What is this surface movement?",
      ["Condensation", "Evaporation", "Runoff", "Freezing"],
      2,
      "LO4",
      "Runoff is water flowing over the land surface.",
    ],
    [
      "Water leaves a lake as vapor. What can happen next as moist air cools?",
      [
        "It changes into sunlight",
        "It can condense into droplets",
        "It must become soil",
        "The cycle ends",
      ],
      1,
      "LO5",
      "Vapor can condense as moist air cools.",
    ],
    [
      "Which statement correctly connects a cloud to rain?",
      [
        "Cloud water always stays suspended",
        "Clouds are only invisible vapor",
        "Cloud droplets can grow and fall",
        "Gravity keeps rain above the ground",
      ],
      2,
      "LO3",
      "Droplets or ice particles can grow large enough to fall.",
    ],
    [
      "A sealed bottle is cold outside. Why might drops appear on its surface?",
      [
        "The bottle creates water",
        "Liquid escapes through intact glass",
        "The label produces vapor",
        "Water vapor in nearby air condenses",
      ],
      3,
      "LO2",
      "The water comes from surrounding air, not through the bottle.",
    ],
    [
      "Why can water in a lake eventually return to that lake as rain?",
      [
        "The water cycle repeats connected processes",
        "Water always travels one fixed route",
        "Rain only comes from that same lake",
        "The Sun pulls down rain",
      ],
      0,
      "LO5",
      "Connected processes move water between surface and atmosphere.",
    ],
  ]),
  C: make("C", [
    [
      "A chilled metal lid becomes wet on the outside. What is the best explanation?",
      [
        "Rain moves through the metal",
        "Vapor in nearby air condenses",
        "Metal changes into liquid",
        "The lid creates new water",
      ],
      1,
      "LO2",
      "Water vapor can cool and condense on the outside.",
    ],
    [
      "Snow falling from a cloud is an example of which process?",
      ["Infiltration", "Condensation", "Precipitation", "Evaporation"],
      2,
      "LO3",
      "Snow is one form of precipitation.",
    ],
    [
      "Sunlight warms a shallow bowl of water. How can water enter the air?",
      [
        "By evaporation",
        "Only by boiling",
        "By runoff upward",
        "By changing into light",
      ],
      0,
      "LO1",
      "Evaporation occurs at a liquid surface without boiling.",
    ],
    [
      "After a storm, water enters spaces in the soil. What happened?",
      [
        "Evaporation",
        "Condensation",
        "Precipitation stopped existing",
        "Infiltration",
      ],
      3,
      "LO4",
      "Infiltration is water soaking into the ground.",
    ],
    [
      "Which connection can move water from the ground toward the atmosphere?",
      [
        "Runoff creates sunlight",
        "Evaporation changes liquid into vapor",
        "Condensation turns soil into water",
        "Gravity pushes all water upward",
      ],
      1,
      "LO5",
      "Evaporation returns surface water to the atmosphere.",
    ],
    [
      "Why do some clouds contain many small liquid droplets?",
      [
        "Water vapor can condense when moist air cools",
        "The Sun turns air into water",
        "All cloud water comes through glass",
        "Clouds contain only water vapor",
      ],
      0,
      "LO2",
      "Condensation produces droplets; clouds may also contain ice.",
    ],
    [
      "Rain reaches a slope. Which route may it take next?",
      [
        "Every drop instantly becomes snow",
        "It must stop moving",
        "It may run downhill to a river",
        "It can no longer evaporate",
      ],
      2,
      "LO4",
      "Water may run off, infiltrate, collect, or later evaporate.",
    ],
    [
      "Which statement best describes the cycle over time?",
      [
        "Every drop follows exactly the same timetable",
        "There is one compulsory starting point",
        "Water disappears after precipitation",
        "Water can repeat the processes along different routes",
      ],
      3,
      "LO5",
      "The simplified cycle has many routes and no single beginning.",
    ],
  ]),
};
export function publicQuestions(form: keyof typeof questionBanks) {
  return questionBanks[form].map(
    ({
      id,
      form,
      type,
      objectiveId,
      stem,
      options,
      reviewStatus,
      version,
    }) => ({
      id,
      form,
      type,
      objectiveId,
      stem,
      options,
      reviewStatus,
      version,
    }),
  );
}
export const responseSchema = z.record(
  z.string().max(32),
  z.number().int().min(0).max(3),
);
export function scoreAnswers(form: keyof typeof questionBanks, input: unknown) {
  const answers = responseSchema.parse(input);
  const bank = questionBanks[form];
  if (
    Object.keys(answers).length !== bank.length ||
    bank.some((q) => answers[q.id] === undefined)
  )
    throw new Error("Answer every question using the supplied form.");
  return {
    correct: bank.filter((q) => answers[q.id] === q.correctAnswer).length,
    total: bank.length,
  };
}
