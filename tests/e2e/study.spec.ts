import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { completeWritten } from "./helpers";
// UI contract fixture only. Database ownership/timing/scoring are independently
// exercised in service.test.ts; this never enrolls a human or reaches research DB.
test("SYNTHETIC participant UI handles assessment, lesson, questionnaires and return", async ({
  page,
}) => {
  let state = "enrolled";
  let progress = 0;
  let followupAvailable = false;
  const visited = new Set<number>();
  const questions = [
    {
      id: "SYNTHETIC-1",
      stem: "Synthetic choice for a UI contract test",
      options: ["Choice A", "Choice B", "Choice C", "Choice D"],
    },
  ];
  await page.route("**/api/study/**", async (route) => {
    const req = route.request();
    const action = new URL(req.url()).pathname.replace("/api/study/", "");
    const body = req.method() === "POST" ? req.postDataJSON() : null;
    let data: unknown = { accepted: true };
    let status = 200;
    if (action === "session")
      data = {
        publicCode: "SYNTHETIC-UI",
        state,
        progress,
        visited: [...visited],
        serverTime: new Date().toISOString(),
        followup:
          state === "waiting_60m"
            ? {
                due_at: new Date(Date.now() + 60 * 60_000).toISOString(),
                deadline_at: new Date(Date.now() + 90 * 60_000).toISOString(),
                status: "not_started",
              }
            : null,
      };
    else if (action === "lesson")
      data = { condition: "medium", progress, visited: [...visited] };
    else if (action === "progress") {
      progress = body.segment;
      visited.add(progress);
    } else if (action === "complete") {
      expect(visited.size).toBe(5);
      state = "lesson_complete";
    } else if (action.startsWith("assessment/")) {
      if (req.method() === "GET") {
        if (action === "assessment/plus_60m" && !followupAvailable) {
          status = 409;
          data = {
            error: { message: "The one-hour follow-up is not available yet." },
          };
        } else
          data = {
            submitted: false,
            questions,
            freeRecallPrompt:
              state === "enrolled"
                ? null
                : "SYNTHETIC: explain the processes you recall.",
          };
      } else {
        expect(body.answers).toEqual({ "SYNTHETIC-1": 0 });
        expect(body).not.toHaveProperty("condition");
        expect(body).not.toHaveProperty("score");
        state =
          state === "enrolled"
            ? "lesson_active"
            : state === "lesson_complete"
              ? "immediate_test_complete"
              : "60m_test_complete";
      }
    } else if (action === "survey/F3") {
      expect(body.mentalEffort).toBe(1);
      expect(body.motion).toBe("not_applicable");
      state = "waiting_60m";
    } else if (action === "survey/F5") {
      expect(body.reviewed).toBe("no");
      expect(body.discussed).toBe("no");
      expect(body.sources).toEqual([]);
      state = "finished";
    } else if (action === "return-token")
      data = { token: "SYNTHETIC-return-secret" };
    await route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify(data),
    });
  });
  await page.goto("/study/session");
  await page.getByLabel("Choice A").check();
  await page.getByRole("button", { name: "Submit assessment" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "A journey without an end",
  );
  await expect(page.getByLabel("Demo visual density")).toHaveCount(0);
  for (let i = 0; i < 4; i++)
    await page.getByRole("button", { name: "Next chapter" }).click();
  await page.getByRole("button", { name: "Complete lesson" }).click();
  await completeWritten(page);
  await page.getByLabel("Choice A").check();
  await page.getByRole("button", { name: "Submit assessment" }).click();
  for (const name of [
    "clarity",
    "overload",
    "support",
    "distraction",
    "pacing",
    "audio",
    "color",
    "acceptability",
    "mentalEffort",
  ])
    await page.locator(`input[name="${name}"]`).first().check();
  await page.locator('input[name="motion"][value="not_applicable"]').check();
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2aa", "wcag21aa"]).analyze())
      .violations,
  ).toEqual([]);
  await page.getByRole("button", { name: "Submit questionnaire" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "See you in an hour",
  );
  await page.getByRole("button", { name: "Create return link" }).click();
  await expect(page.getByLabel("Private return link")).toHaveValue(
    /#SYNTHETIC-return-secret$/,
  );
  await page
    .getByRole("button", { name: "Check follow-up availability" })
    .click();
  await expect(page.locator('.form-error[role="alert"]')).toContainText("not available yet");
  followupAvailable = true;
  await page
    .getByRole("button", { name: "Check follow-up availability" })
    .click();
  await completeWritten(page, "SYNTHETIC delayed");
  await page.getByLabel("Choice A").check();
  await page.getByRole("button", { name: "Submit assessment" }).click();
  await page
    .getByLabel("Since the lesson, did you review the topic anywhere?")
    .selectOption("no");
  await page
    .getByLabel("Since the lesson, did you discuss the material with anyone?")
    .selectOption("no");
  await page.locator('input[name="confidence"]').first().check();
  await page.locator('input[name="recallEffort"]').first().check();
  await page.getByRole("button", { name: "Submit questionnaire" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Your participation is complete.",
  );
});
