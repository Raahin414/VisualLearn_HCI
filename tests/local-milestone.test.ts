import { describe, it, expect } from "vitest";
import { readDraft, validateDraft } from "@/lib/assessments/draft";
import { readDemoProgress } from "@/lib/content/demo-progress";
import {
  LocalStudy,
  LOCAL_DEMO_KEY,
  type DemoBanks,
} from "@/lib/demo/local-study";
import { publicQuestions } from "@/lib/assessments/questions.server";
const banks: DemoBanks = {
  A: publicQuestions("A"),
  B: publicQuestions("B"),
  C: publicQuestions("C"),
};
function memory() {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
    removeItem: (key: string) => {
      map.delete(key);
    },
  };
}
const answers = (form: "A" | "B" | "C") =>
  Object.fromEntries(banks[form].map((q) => [q.id, 0]));
const f3 = {
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
describe("Assessment drafts and demo progress", () => {
  it("restores only recognized question IDs and in-range options", () => {
    const value = readDraft(
      JSON.stringify({
        answers: { "A-1": 1, "A-2": 7, unknown: 0 },
        freeRecall: "Draft text",
      }),
      banks.A,
    );
    expect(value.answers).toEqual({ "A-1": 1 });
    expect(value.freeRecall).toBe("Draft text");
    expect(readDraft("not json", banks.A)).toEqual({
      answers: {},
      freeRecall: "",
    });
  });
  it("finds missing answers and rejects whitespace recall", () => {
    expect(
      validateDraft({ answers: {}, freeRecall: "" }, banks.A)?.questionId,
    ).toBe("A-1");
    expect(
      validateDraft(
        { answers: answers("B"), freeRecall: " ".repeat(30) },
        banks.B,
        true,
      )?.questionId,
    ).toBe("freeRecall");
    expect(
      validateDraft(
        {
          answers: answers("B"),
          freeRecall: "A sufficiently long explanation.",
        },
        banks.B,
        true,
      ),
    ).toBeNull();
  });
  it("deduplicates visited chapters and includes the current chapter", () => {
    expect(
      readDemoProgress(
        JSON.stringify({ segment: 3, condition: "high", visited: [0, 0, 1] }),
      ),
    ).toEqual({ segment: 3, condition: "high", visited: [0, 1, 3] });
    expect(
      readDemoProgress(
        JSON.stringify({ segment: 20, condition: "high", visited: [] }),
      ).segment,
    ).toBe(0);
  });
});
describe("Isolated SYNTHETIC browser simulation", () => {
  it("reuses the full flow, keeps condition stable, restores and advances only its clock", async () => {
    const storage = memory();
    const clock = () => Date.parse("2026-10-16T10:00:00Z");
    const model = new LocalStudy(storage, banks, clock);
    model.start("high");
    await expect(model.request("complete", {})).rejects.toThrow();
    await model.request("assessment/pre", { answers: answers("A") });
    expect(
      ((await model.request("lesson")) as { condition: string }).condition,
    ).toBe("high");
    expect(() => model.advanceTo("due")).toThrow();
    for (let i = 0; i < 5; i++) await model.request("progress", { segment: i });
    await model.request("complete", {});
    const completed = model.getRecord()!.lessonCompletedAt;
    await model.request("complete", {});
    expect(model.getRecord()!.lessonCompletedAt).toBe(completed);
    await model.request("assessment/immediate", {
      answers: answers("B"),
      freeRecall: "SYNTHETIC explanation with sufficient length.",
    });
    await expect(model.request("survey/F3", {})).rejects.toThrow();
    await model.request("survey/F3", f3);
    await expect(model.request("assessment/plus_60m")).rejects.toThrow(
      /not available yet/,
    );
    const restored = new LocalStudy(storage, banks, clock);
    expect(restored.getRecord()!.condition).toBe("high");
    restored.advanceTo("due");
    expect(
      (
        (await restored.request("assessment/plus_60m")) as {
          questions: unknown[];
        }
      ).questions,
    ).toHaveLength(8);
    await restored.request("assessment/plus_60m", {
      answers: answers("C"),
      freeRecall: "SYNTHETIC delayed explanation with sufficient length.",
    });
    await restored.request("survey/F5", {
      reviewed: "no",
      sources: [],
      discussed: "no",
      confidence: 3,
      recallEffort: 5,
    });
    expect(restored.getRecord()!.state).toBe("finished");
    expect(JSON.stringify(restored.getRecord())).not.toMatch(
      /correctAnswer|score|rationale/,
    );
    restored.reset();
    expect(storage.getItem(LOCAL_DEMO_KEY)).toBeNull();
  });
  it("preserves first submission and blocks the expired window", async () => {
    const model = new LocalStudy(memory(), banks, () =>
      Date.parse("2026-10-16T10:00:00Z"),
    );
    model.start("low");
    await model.request("assessment/pre", { answers: answers("A") });
    await model.request("assessment/pre", { answers: {} });
    expect(model.getRecord()!.submissions.pre!.answers).toEqual(answers("A"));
    for (let i = 0; i < 5; i++) await model.request("progress", { segment: i });
    await model.request("complete", {});
    await model.request("assessment/immediate", {
      answers: answers("B"),
      freeRecall: "A sufficiently long SYNTHETIC recall response.",
    });
    await model.request("survey/F3", f3);
    model.advanceTo("expired");
    await expect(model.request("assessment/plus_60m")).rejects.toThrow(
      /expired/,
    );
    expect(model.getRecord()!.submissions.plus_60m).toBeUndefined();
  });
  it("cannot recover a real participant or perform unsupported operations", async () => {
    const model = new LocalStudy(memory(), banks);
    model.start("medium");
    await expect(
      model.request("recover", { token: "real-token" }),
    ).rejects.toThrow(/not supported/);
    await model.request("withdraw", {});
    await expect(model.request("lesson")).rejects.toThrow(/discarded/);
  });
});
