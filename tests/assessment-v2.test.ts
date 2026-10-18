import { describe, it, expect } from "vitest";
import {
  answerKey,
  isCorrect,
  publicQuestions,
  questionBanks,
  scoreAnswers,
  type Question,
} from "@/lib/assessments/questions.server";
import { rubrics, ratingSchema } from "@/lib/assessments/rubrics.server";
import { writtenPrompts } from "@/lib/assessments/written-prompts";
import { readDraft, validateDraft, isComplete } from "@/lib/assessments/draft";
import {
  readSurveyDraft,
  validateSurveyDraft,
  surveySubmission,
} from "@/lib/assessments/survey-draft";
import { f3Schema, f5Schema } from "@/lib/assessments/surveys";
import { LocalStudy } from "@/lib/demo/local-study";
import { lesson } from "@/lib/content/lesson";
const forms = ["A", "B", "C"] as const;
const lessonText = lesson.segments
  .map((s) => `${s.heading} ${s.body} ${s.keyIdea}`)
  .join(" ")
  .toLowerCase();
const blueprint = (q: Question) =>
  `${q.type}:${q.skill}:${q.objectiveId}:${q.estimatedDifficulty}`;
describe("Parallel A/B/C forms", () => {
  it("share one blueprint of item types, skills, objectives and difficulty", () => {
    const [a, b, c] = forms.map((f) => questionBanks[f].map(blueprint));
    expect(a).toHaveLength(8);
    expect(b).toEqual(a);
    expect(c).toEqual(a);
    for (const f of forms) {
      const types = questionBanks[f].map((q) => q.type);
      expect(types.filter((t) => t === "ordering")).toHaveLength(1);
      expect(types.filter((t) => t === "labeling")).toHaveLength(1);
      // Equal option counts at every position keep chance rates comparable.
      expect(
        questionBanks[f].map((q) =>
          q.type === "mcq"
            ? q.options.length
            : q.type === "ordering"
              ? q.steps.length
              : `${q.markers.length}/${q.options.length}`,
        ),
      ).toEqual([4, 4, 4, 4, 4, "4/5", 4, 4]);
    }
  });
  it("covers LO1–LO5 and never repeats a stem across forms or practice", () => {
    for (const f of forms) {
      const objectives = questionBanks[f].map((q) => q.objectiveId).join(" ");
      for (const lo of ["LO1", "LO2", "LO3", "LO4", "LO5"])
        expect(objectives).toContain(lo);
    }
    const unique = (stems: string[]) => new Set(stems).size;
    const mcqStems = [...forms, "P" as const].flatMap((f) =>
      questionBanks[f].filter((q) => q.type === "mcq").map((q) => q.stem),
    );
    expect(unique(mcqStems)).toBe(mcqStems.length);
    const steps = forms.map((f) =>
      JSON.stringify(
        questionBanks[f].find((q) => q.type === "ordering")!,
      ),
    );
    expect(new Set(steps).size).toBe(3);
    const labelKeys = forms.map((f) => JSON.stringify(answerKey(f)[`${f}-6`]));
    expect(new Set(labelKeys).size).toBe(3);
  });
  it("draws every keyed process from the canonical lesson text", () => {
    const processes = [
      "evaporat",
      "condens",
      "precipitation",
      "runoff",
      "infiltration",
      "collection",
      "water vapor",
      "droplets",
    ];
    for (const f of forms)
      for (const q of questionBanks[f]) {
        const keyed =
          q.type === "mcq"
            ? q.options[q.correctAnswer]
            : q.type === "ordering"
              ? q.steps.join(" ")
              : q.correctLabels.map((i) => q.options[i]).join(" ");
        const terms = processes.filter((p) => keyed.toLowerCase().includes(p));
        for (const term of terms) expect(lessonText).toContain(term);
      }
    // Written scenario conditions are taught explicitly in the lesson.
    for (const word of ["warm", "breezy", "moving air"])
      expect(lessonText).toContain(word);
  });
  it("adds parallel written prompts only after the lesson", () => {
    expect(writtenPrompts.pre).toEqual({ freeRecall: null, scenario: null });
    for (const t of ["immediate", "plus_60m"] as const) {
      expect(writtenPrompts[t].freeRecall).toMatch(/how they connect/);
      expect(writtenPrompts[t].scenario).toMatch(/why/i);
    }
    expect(writtenPrompts.immediate.scenario).not.toBe(
      writtenPrompts.plus_60m.scenario,
    );
    expect(rubrics.free_recall.criteria).toHaveLength(5);
    expect(rubrics.scenario.maxScore).toBe(4);
    expect(() =>
      ratingSchema("scenario").parse({ process: 2, conditions: 3 }),
    ).toThrow();
  });
});
describe("Ordering and labeling scoring", () => {
  const ordering = questionBanks.B.find((q) => q.type === "ordering")!;
  const labeling = questionBanks.B.find((q) => q.type === "labeling")!;
  it("accepts any starting point of the cycle but not a reversed or broken order", () => {
    if (ordering.type !== "ordering") throw new Error();
    const cycle = ordering.correctCycle;
    for (let i = 0; i < 4; i++)
      expect(
        isCorrect(ordering, [...cycle.slice(i), ...cycle.slice(0, i)]),
      ).toBe(true);
    expect(isCorrect(ordering, [...cycle].reverse())).toBe(false);
    expect(isCorrect(ordering, [cycle[1], cycle[0], cycle[2], cycle[3]])).toBe(
      false,
    );
  });
  it("scores labeling all-or-nothing and rejects malformed multi-part answers", () => {
    const key = answerKey("B");
    expect(scoreAnswers("B", key).itemScores).toEqual(
      Object.fromEntries(questionBanks.B.map((q) => [q.id, 1])),
    );
    const swapped = [...(key[labeling.id] as number[])];
    [swapped[0], swapped[1]] = [swapped[1], swapped[0]];
    const result = scoreAnswers("B", { ...key, [labeling.id]: swapped });
    expect(result.correct).toBe(7);
    expect(result.itemScores[labeling.id]).toBe(0);
    expect(() =>
      scoreAnswers("B", { ...key, [ordering.id]: [0, 0, 1, 2] }),
    ).toThrow();
    expect(() =>
      scoreAnswers("B", { ...key, [labeling.id]: [0, 1, 2] }),
    ).toThrow();
    expect(() => scoreAnswers("B", { ...key, [ordering.id]: 1 })).toThrow();
  });
  it("projects multi-part items without keys", () => {
    for (const f of forms) {
      const json = JSON.stringify(publicQuestions(f));
      expect(json).not.toMatch(/"correct\w*"|rationale|Difficulty/);
      // Marker slots are neutral positions, not process names.
      expect(json).toMatch(/"slot":"s\d"/);
    }
  });
});
describe("Assessment drafts with multi-part items", () => {
  const qs = publicQuestions("A");
  const order = qs.find((q) => q.type === "ordering")!;
  it("restores partial ordering drafts but requires each step once to submit", () => {
    const draft = readDraft(
      JSON.stringify({
        answers: { [order.id]: [1, -1, -1, -1], "A-1": 9 },
        freeRecall: "",
        writtenDone: true,
      }),
      qs,
    );
    expect(draft.answers).toEqual({ [order.id]: [1, -1, -1, -1] });
    expect(draft.writtenDone).toBe(true);
    expect(isComplete(order, [1, 1, 2, 3])).toBe(false);
    expect(isComplete(order, [3, 1, 2, 0])).toBe(true);
    const all = Object.fromEntries(
      qs.map((q) => [
        q.id,
        q.type === "ordering"
          ? [0, 1, 2, 2]
          : q.type === "labeling"
            ? [0, 1, 2, 3]
            : 0,
      ]),
    );
    expect(
      validateDraft({ answers: all, freeRecall: "", scenario: "" }, qs)
        ?.message,
    ).toMatch(/each step exactly once/);
  });
  it("checks written answers before objective items", () => {
    expect(
      validateDraft(
        { answers: {}, freeRecall: "Enough text for the recall item.", scenario: "" },
        publicQuestions("B"),
        true,
        true,
      )?.questionId,
    ).toBe("scenario");
  });
});
describe("Questionnaire drafts", () => {
  it("restore only valid known F3 fields and validate N/A", () => {
    const draft = readSurveyDraft(
      JSON.stringify({ clarity: 4, overload: 9, motion: "not_applicable", x: 1 }),
      "F3",
    );
    expect(draft).toEqual({ clarity: 4, motion: "not_applicable" });
    expect(readSurveyDraft("{bad", "F3")).toEqual({});
    const invalid = validateSurveyDraft("F3", draft);
    expect(invalid?.field).toBe("overload");
    expect(invalid?.message).toMatch(/8 remaining/);
  });
  it("require an explicit F5 discussion answer and a source only when review is reported", () => {
    const base = { reviewed: "yes", confidence: 3, recallEffort: 4 };
    expect(validateSurveyDraft("F5", base)?.field).toBe("sources");
    expect(
      validateSurveyDraft("F5", { ...base, sources: ["notes"] })?.field,
    ).toBe("discussed");
    const ok = { ...base, sources: ["notes"], discussed: "no" };
    expect(validateSurveyDraft("F5", ok)).toBeNull();
    expect(f5Schema.parse(surveySubmission("F5", ok)).issues).toBe("");
    // Sources ticked before switching to "no" are not submitted.
    expect(
      surveySubmission("F5", { ...ok, reviewed: "no" }).sources,
    ).toEqual([]);
  });
  it("build valid F3 submissions with empty optional text", () => {
    const full = {
      clarity: 4,
      overload: 2,
      support: 4,
      distraction: 2,
      pacing: 4,
      audio: 4,
      motion: "not_applicable",
      color: 3,
      acceptability: 4,
      mentalEffort: 5,
    };
    expect(validateSurveyDraft("F3", full)).toBeNull();
    expect(f3Schema.parse(surveySubmission("F3", full))).toMatchObject({
      confusing: "",
      helpful: "",
    });
  });
});
describe("Condition independence of assessments", () => {
  it("serves identical forms and prompts to every simulated condition", async () => {
    const banks = {
      A: publicQuestions("A"),
      B: publicQuestions("B"),
      C: publicQuestions("C"),
    };
    const memory = () => {
      const map = new Map<string, string>();
      return {
        getItem: (k: string) => map.get(k) ?? null,
        setItem: (k: string, v: string) => void map.set(k, v),
        removeItem: (k: string) => void map.delete(k),
      };
    };
    const payloads = await Promise.all(
      (["low", "medium", "high"] as const).map(async (condition) => {
        const model = new LocalStudy(memory(), banks);
        model.start(condition);
        return JSON.stringify(await model.request("assessment/pre"));
      }),
    );
    expect(new Set(payloads).size).toBe(1);
  });
});
