/** One course, one study, three visual-density conditions. */
export const experiments = [
  {
    id: "E1",
    name: "Visual density",
    factor: "Density of visual material",
    arms: ["low", "medium", "high"],
    technicalTesting: true,
    status: "draft" as const,
    recruiting: false,
    protocolVersion: "2.1.0-e1-draft",
    contentId: "water-cycle-v1",
    primaryOutcome: "Adjusted immediate percentage correct",
    invariantContent:
      "Canonical factual script, narration, objectives and assessment bank",
    exclusionRules: "Pending approved protocol; no automatic exclusion",
    assessmentForms: ["A", "B", "C"],
    optionalForms: ["D"],
    followupMinutes: 60,
  },
];
export function canRecruit(id: string) {
  return experiments.some((e) => e.id === id && e.recruiting);
}
