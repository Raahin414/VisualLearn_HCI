// Real local Auth/PostgreSQL. Time shifts are confined to SYNTHETIC rows.
import { test, expect } from "@playwright/test";
import {
  db,
  api,
  enroll,
  answerAll,
  completeWritten,
  finishLesson,
  fillF3,
  sessionId,
  shiftFollowup,
} from "./support";
test.describe.configure({ mode: "serial" });
test.beforeAll(async () => {
  await db.query(
    "update visuallearn.experiments set seven_day_enabled=true,seven_day_reviewed=true,seven_day_form_version='1.0-seven-day-draft',seven_day_window_minutes=60 where id='E1'",
  );
});
test.afterAll(async () => {
  await db.query(
    "update visuallearn.experiments set seven_day_enabled=false,seven_day_reviewed=false,seven_day_form_version=null,seven_day_window_minutes=null where id='E1'",
  );
  await db.end();
});
test("optional D/F6 survives refresh, checks server time and remains separate from C/F5", async ({
  page,
}) => {
  await enroll(page);
  const id = (await sessionId(page.context()))!;
  await answerAll(page);
  await page.getByRole("button", { name: "Submit assessment" }).click();
  await finishLesson(page);
  await completeWritten(page);
  await answerAll(page);
  await page.getByRole("button", { name: "Submit assessment" }).click();
  await fillF3(page);
  await page.getByRole("button", { name: "Submit questionnaire" }).click();
  await expect(
    page.getByRole("heading", { name: "Thank you. See you in an hour." }),
  ).toBeVisible();
  await shiftFollowup(id, 61);
  await page.reload();
  await page
    .getByRole("button", { name: "Check follow-up availability" })
    .click();
  await completeWritten(page);
  await answerAll(page);
  await page.getByRole("button", { name: "Submit assessment" }).click();
  async function submitExposure() {
    await page
      .getByLabel("Since the lesson, did you review the topic anywhere?")
      .selectOption("yes");
    await page.getByLabel("Notes", { exact: true }).check();
    await page
      .getByLabel("Since the lesson, did you discuss the material with anyone?")
      .selectOption("no");
    await page.locator('input[name="confidence"]').nth(2).check();
    await page.locator('input[name="recallEffort"]').nth(3).check();
    await page.getByRole("button", { name: "Submit questionnaire" }).click();
  }
  await submitExposure();
  await expect(
    page.getByRole("heading", { name: "Your seven-day follow-up." }),
  ).toBeVisible();
  expect((await api(page, "assessment/plus_7d")).status).toBe(409);
  // A new wall-clock Date in the browser is not an eligibility override.
  await page.evaluate(() => {
    Date.now = () => 9999999999999;
  });
  expect((await api(page, "assessment/plus_7d")).status).toBe(409);
  await shiftFollowup(id, 7 * 1440 - 60);
  await page.reload();
  await page
    .getByRole("button", { name: "Check follow-up availability" })
    .click();
  await expect(page.locator('textarea[name="freeRecall"]')).toHaveAttribute(
    "name",
    "freeRecall",
  );
  const projection = await api(page, "assessment/plus_7d");
  expect(
    projection.body.questions.every((q: { id: string }) =>
      q.id.startsWith("D-"),
    ),
  ).toBe(true);
  expect(JSON.stringify(projection.body)).not.toMatch(
    /correctAnswer|rationale|correctLabels/,
  );
  await completeWritten(page, "SYNTHETIC optional seven-day");
  await answerAll(page);
  await page.reload();
  await page
    .getByRole("button", { name: "Check follow-up availability" })
    .click();
  await expect(
    page.getByText("8 of 8 answered", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Submit assessment" }).click();
  await submitExposure();
  await expect(
    page.getByRole("heading", { name: "Your participation is complete." }),
  ).toBeVisible();
  expect(
    (await api(page, "assessment/plus_7d", {})).body.alreadySubmitted,
  ).toBe(true);
  const attempts = (
    await db.query(
      "select timepoint,form_key from visuallearn.assessment_attempts where session_id=$1 order by timepoint",
      [id],
    )
  ).rows;
  expect(attempts).toContainEqual({ timepoint: "plus_60m", form_key: "C" });
  expect(attempts).toContainEqual({ timepoint: "plus_7d", form_key: "D" });
  expect(
    (
      await db.query(
        "select form_key from visuallearn.survey_submissions where session_id=$1 and form_key='F6'",
        [id],
      )
    ).rowCount,
  ).toBe(1);
  await api(page, "withdraw", {});
  expect((await api(page, "session")).status).toBe(401);
});
