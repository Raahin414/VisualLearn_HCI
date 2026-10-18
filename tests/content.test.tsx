import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { WaterDiagram } from "@/components/learning/water-diagram";
import { lesson, conditions, densityConfig } from "@/lib/content/lesson";
import {
  answerKey,
  publicQuestions,
  questionBanks,
  scoreAnswers,
} from "@/lib/assessments/questions.server";
describe("Canonical content and stimulus invariants", () => {
  it("has five complete segments with fixed narration and objective coverage", () => {
    expect(lesson.segments).toHaveLength(5);
    expect(new Set(lesson.segments.flatMap((s) => s.objectiveIds)).size).toBe(
      5,
    );
    for (const s of lesson.segments) {
      expect(s.body.split(/\s+/).length).toBeGreaterThan(120);
      expect(s.audioSrc).toMatch(/\.wav$/);
    }
  });
  it("keeps essential diagram meaning and labels identical across density tiers", () => {
    const svgs = conditions.map((condition) =>
      renderToStaticMarkup(<WaterDiagram condition={condition} />),
    );
    for (const svg of svgs) {
      for (const label of [
        "Evaporation",
        "Condensation",
        "Precipitation",
        "Collection",
      ])
        expect(svg).toContain(label);
      expect(svg).toContain("the Sun provides energy");
    }
    expect(svgs[0]).not.toContain('data-tier="supportive"');
    expect(svgs[1]).toContain('data-tier="supportive"');
    expect(svgs[1]).not.toContain('data-tier="decorative"');
    expect(svgs[2]).toContain('data-tier="decorative"');
    expect(densityConfig.high.supportive).toBe(true);
  });
  it("never serializes keys or rationales into learner questions", () => {
    for (const form of ["A", "B", "C"] as const) {
      const publicJson = JSON.stringify(publicQuestions(form));
      expect(publicJson).not.toMatch(
        /correctAnswer|correctCycle|correctLabels|rationale|estimatedDifficulty/,
      );
      expect(questionBanks[form]).toHaveLength(8);
    }
  });
  it("scores complete responses on the server and rejects invented/missing answers", () => {
    const correct = answerKey("B");
    expect(scoreAnswers("B", correct)).toMatchObject({ correct: 8, total: 8 });
    expect(() => scoreAnswers("B", {})).toThrow();
    expect(() => scoreAnswers("B", { ...correct, "B-fake": 0 })).toThrow();
    expect(() => scoreAnswers("B", { ...correct, "B-1": 10 })).toThrow();
  });
});
