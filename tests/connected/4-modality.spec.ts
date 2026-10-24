// Real local Supabase/PostgreSQL only; no HTTP mocks or synthetic login bypass.
import { test, expect } from "@playwright/test";
const MODALITY_VERSION = "modality-v1-draft";
import {
  api,
  db,
  enroll,
  answerAll,
  sessionId,
  finishLesson,
  completeWritten,
  fillF3,
  shiftFollowup,
} from "./support";

test.afterAll(async () => {
  await db.end();
});
test("E2 real assignment delivers all four arms, persists accommodation and completes delayed workflow", async ({
  browser,
}) => {
  await db.query(
    "update visuallearn.experiments set enabled=true,pilot_reviewed=true,pilot_contract_version=$1,status='recruiting',content_approved=true,ethics_approved=true,consent_version='SYNTHETIC-LOCAL-CONSENT',consent_text='SYNTHETIC LOCAL TEST ONLY',study_contact='SYNTHETIC' where id='E2'",
    [MODALITY_VERSION],
  );
  const seen = new Set<string>();
  try {
    for (let i = 0; i < 4; i++) {
      const context = await browser.newContext();
      try {
        const page = await context.newPage();
        await enroll(page, "E2");
        const id = (await sessionId(context))!;
        await answerAll(page);
        await page.getByRole("button", { name: "Submit assessment" }).click();
        await expect(
          page.getByText("CHAPTER 1 OF 5", { exact: true }),
        ).toBeVisible();
        const row = (
          await db.query(
            "select a.arm_key,s.presentation_version,s.lesson_opened_at from visuallearn.sessions s join visuallearn.assignments a on a.id=s.assignment_id where s.id=$1",
            [id],
          )
        ).rows[0];
        seen.add(row.arm_key);
        expect(row.presentation_version).toBe(MODALITY_VERSION);
        expect(row.lesson_opened_at).toBeTruthy();
        const audio = row.arm_key.startsWith("audio");
        const diagram = row.arm_key.endsWith("diagram");
        const region = page.getByRole("region", {
          name: "Assigned lesson presentation",
        });
        await expect(region.locator("audio")).toHaveCount(audio ? 1 : 0);
        await expect(region.locator('svg[role="img"]')).toHaveCount(
          diagram ? 1 : 0,
        );
        await expect(page.getByLabel("Simulated presentation")).toHaveCount(0);
        const response = await api(page, "lesson");
        expect(JSON.stringify(response.body)).not.toMatch(
          /correctAnswer|correctCycle|rationale|rubric/,
        );
        if (audio) {
          await expect(region.locator(".instruction-script")).toHaveCount(0);
          await region
            .getByRole("button", {
              name: "Show transcript (accessibility accommodation)",
            })
            .click();
          await expect
            .poll(
              async () =>
                (
                  await db.query(
                    "select accommodations from visuallearn.sessions where id=$1",
                    [id],
                  )
                ).rows[0].accommodations,
            )
            .toHaveProperty("transcript:overview");
        }
        await page.reload();
        await expect(region).toBeVisible();
        await expect(region.locator("audio")).toHaveCount(audio ? 1 : 0);
        if (i === 3) {
          await finishLesson(page);
          await completeWritten(page);
          await answerAll(page);
          await page.getByRole("button", { name: "Submit assessment" }).click();
          await fillF3(page);
          await page
            .locator('input[name="support"][value="not_applicable"]')
            .check();
          await page
            .getByRole("button", { name: "Submit questionnaire" })
            .click();
          await expect(
            page.getByRole("heading", {
              name: "Thank you. See you in an hour.",
            }),
          ).toBeVisible();
          expect((await api(page, "assessment/plus_60m")).status).toBe(409);
          await shiftFollowup(id, 61);
          await page.reload();
          // The real server gate opens after shifting this disposable SYNTHETIC row.
          expect((await api(page, "assessment/plus_60m")).status).toBe(200);
          await page
            .getByRole("button", { name: "Check follow-up availability" })
            .click();
          await expect(
            page.getByRole("textbox", { name: /Without replaying/ }),
          ).toBeVisible();
          await completeWritten(page, "SYNTHETIC E2 delayed");
          await answerAll(page);
          await page.getByRole("button", { name: "Submit assessment" }).click();
          await page
            .getByLabel("Since the lesson, did you review the topic anywhere?")
            .selectOption("no");
          await page
            .getByLabel(
              "Since the lesson, did you discuss the material with anyone?",
            )
            .selectOption("no");
          await page.locator('input[name="confidence"]').nth(2).check();
          await page.locator('input[name="recallEffort"]').nth(3).check();
          await page
            .getByRole("button", { name: "Submit questionnaire" })
            .click();
          await expect(
            page.getByRole("heading", {
              name: "Your participation is complete.",
            }),
          ).toBeVisible();
          expect(
            (
              await db.query(
                "select status from visuallearn.scheduled_followups where session_id=$1 and timepoint='plus_60m'",
                [id],
              )
            ).rows[0].status,
          ).toBe("completed_in_window");
          expect(
            (
              await db.query(
                "select count(*)::int n from visuallearn.survey_submissions where session_id=$1 and form_version='2.1-modality-draft'",
                [id],
              )
            ).rows[0].n,
          ).toBe(1);
        }
        await api(page, "withdraw", {});
        expect((await api(page, "session")).status).toBe(401);
      } finally {
        await context.close();
      }
    }
    expect([...seen].sort()).toEqual([
      "audio-diagram",
      "audio-only",
      "text-diagram",
      "text-only",
    ]);
  } finally {
    await db.query(
      "update visuallearn.experiments set enabled=false,status='draft',content_approved=false,ethics_approved=false,pilot_reviewed=false,pilot_contract_version=null where id='E2'",
    );
  }
});
