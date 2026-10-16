export const experiments = [
  {
    id: "E1",
    name: "Visual density",
    factor: "Density of visual material",
    arms: ["low", "medium", "high"],
    technicalTesting: true,
  },
  {
    id: "E2",
    name: "Multimedia modality",
    factor: "Presentation channel",
    arms: ["text-only", "audio-only", "text-diagram", "audio-diagram"],
    technicalTesting: false,
  },
  {
    id: "E3",
    name: "Information chunking",
    factor: "Simultaneous information",
    arms: ["chunked", "grouped", "all-at-once"],
    technicalTesting: false,
  },
  {
    id: "E4",
    name: "Animation",
    factor: "Instructional motion",
    arms: ["static", "step-through", "animated"],
    technicalTesting: false,
  },
  {
    id: "E5",
    name: "Color and hierarchy",
    factor: "Color salience",
    arms: ["neutral", "semantic", "saturated"],
    technicalTesting: false,
  },
  {
    id: "E6",
    name: "Interactivity",
    factor: "Learner control",
    arms: ["passive", "guided", "manipulable"],
    technicalTesting: false,
  },
  {
    id: "E7",
    name: "Video delivery",
    factor: "Explanation medium",
    arms: ["video", "diagram-sequence", "interactive"],
    technicalTesting: false,
  },
  {
    id: "E8",
    name: "Adaptive delivery",
    factor: "Selection policy",
    arms: ["fixed", "rules-based"],
    technicalTesting: false,
  },
].map((e) => ({
  ...e,
  status: "draft" as const,
  recruiting: false,
  protocolVersion: "2.0.0-draft",
  contentId: "water-cycle-v1",
  primaryOutcome: "Adjusted immediate percentage correct",
  invariantContent: "Canonical factual script, objectives and assessment bank",
  exclusionRules: "Pending approved protocol; no automatic exclusion",
  assessmentForms: ["A", "B", "C"],
  optionalForms: ["D"],
  followupMinutes: 60,
}));
export function canRecruit(id: string) {
  return experiments.some((e) => e.id === id && e.recruiting);
}
