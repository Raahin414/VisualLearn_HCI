import { describe, expect, it } from "vitest";
import {
  responseReview,
  type ReviewResponse,
} from "@/lib/admin/response-review.server";
const row = (
  answers: Record<string, unknown>,
  extra: Partial<ReviewResponse> = {},
): ReviewResponse => ({
  cohort: "SYNTHETIC E1 low / frozen-v1",
  form_key: "F3",
  form_version: "SYNTHETIC-F3",
  answers_json: answers,
  ...extra,
});
describe("Draft response-based review prompts", () => {
  it("uses actual answers and correct denominators without counting N/A or missing as zero", () => {
    const result = responseReview([
      row({ clarity: 1, overload: 5, mentalEffort: 8 }),
      row({ clarity: 4, overload: 2, mentalEffort: 3 }),
      row({ clarity: "not_applicable", overload: null }),
      row({ clarity: 99, overload: "5" }),
    ]);
    expect(result.version).toBe("response-review-v1-draft");
    for (const key of ["clarity", "overload", "effort"])
      expect(result.items.find((item) => item.id === key)).toMatchObject({
        eligible: 2,
        flagged: 1,
      });
    expect(result.items.find((item) => item.id === "pacing")).toBeUndefined();
  });
  it("keeps study/presentation, frozen cohort and questionnaire versions separate", () => {
    const result = responseReview([
      row({ overload: 5 }),
      row({ overload: 1 }, { cohort: "SYNTHETIC E2 audio / frozen-v1" }),
      row({ overload: 5 }, { form_version: "SYNTHETIC-F3-v2" }),
    ]);
    expect(result.items).toHaveLength(3);
    expect(result.items.every((item) => item.eligible === 1)).toBe(true);
  });
  it("flags interim review separately at one hour and seven days without inferring causation", () => {
    const result = responseReview([
      row({ reviewed: "yes" }, { form_key: "F5" }),
      row({ reviewed: "no" }, { form_key: "F6" }),
      row({ reviewed: "unsure" }, { form_key: "F5" }),
    ]);
    expect(result.items.find((item) => item.form === "F5")).toMatchObject({
      eligible: 2,
      flagged: 1,
    });
    expect(result.items.find((item) => item.form === "F6")).toMatchObject({
      eligible: 1,
      flagged: 0,
    });
    expect(result.items[0].action).toContain("Do not automatically exclude");
  });
  it("does not return free text or create findings for empty input", () => {
    expect(responseReview([]).items).toEqual([]);
    expect(
      JSON.stringify(
        responseReview([row({ confusing: "SYNTHETIC private comment" })]),
      ),
    ).not.toContain("private comment");
  });
});
