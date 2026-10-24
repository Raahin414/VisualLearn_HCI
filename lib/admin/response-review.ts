import definitions from "@/content/review-heuristics.json";
export { definitions as responseReviewDefinitions };
export type ReviewResponse = {
  cohort: string;
  form_key: string;
  form_version: string;
  answers_json: Record<string, unknown>;
};
/** Observed answers only. Missing, malformed and N/A never become numeric zero. */
export function responseReview(rows: ReviewResponse[]) {
  const groups = new Map<string, ReviewResponse[]>();
  for (const row of rows) {
    const key = JSON.stringify([row.cohort, row.form_key, row.form_version]);
    const group = groups.get(key) ?? [];
    group.push(row);
    groups.set(key, group);
  }
  return {
    version: definitions.version,
    items: [...groups.values()].flatMap((group) =>
      definitions.rules
        .filter((rule) => rule.forms.includes(group[0].form_key))
        .map((rule) => {
          const values = group
            .map((row) => row.answers_json[rule.field])
            .filter((value) =>
              typeof rule.threshold === "number"
                ? typeof value === "number" &&
                  Number.isInteger(value) &&
                  value >= rule.min! &&
                  value <= rule.max!
                : typeof value === "string" &&
                  (rule.allowed as string[]).includes(value),
            );
          const flagged = values.filter((value) =>
            typeof value === "number" && typeof rule.threshold === "number"
              ? rule.operator === "gte"
                ? value >= rule.threshold
                : value <= rule.threshold
              : value === rule.threshold,
          ).length;
          return {
            id: rule.id,
            cohort: group[0].cohort,
            form: group[0].form_key,
            formVersion: group[0].form_version,
            title: rule.title,
            check: rule.check,
            action: rule.action,
            eligible: values.length,
            flagged,
          };
        })
        .filter((item) => item.eligible > 0),
    ),
  };
}
