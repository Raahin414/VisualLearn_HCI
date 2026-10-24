// Real local Supabase/PostgreSQL; no HTTP mocks, eligibility or login bypass.
import { test, expect } from "@playwright/test";
import {
  db,
  api,
  enroll,
  answerAll,
  sessionId,
  completeWritten,
  fillF3,
  shiftFollowup,
} from "./support";
test.afterAll(async () => {
  await db.end();
});
test("E3 assigns all groups, persists exposure proxies and completes the real delayed workflow", async ({
  browser,
}) => {
  await db.query(
    "update visuallearn.experiments set enabled=true,pilot_reviewed=true,pilot_contract_version='chunking-v1-draft',study_time_policy='self-paced-no-minimum-v1',status='recruiting',content_approved=true,ethics_approved=true,consent_version='SYNTHETIC-LOCAL-CONSENT',consent_text='SYNTHETIC LOCAL TEST ONLY',study_contact='SYNTHETIC' where id='E3'",
  );
  const seen = new Set<string>();
  try {
    for (let number = 0; number < 3; number++) {
      const context = await browser.newContext();
      try {
        const page = await context.newPage();
        await enroll(page, "E3");
        const id = (await sessionId(context))!;
        await answerAll(page);
        await page.getByRole("button", { name: "Submit assessment" }).click();
        const region = page.getByRole("region", {
          name: "Assigned lesson presentation",
        });
        await expect(region).toBeVisible();
        const arm = (
          await db.query(
            "select a.arm_key from visuallearn.sessions s join visuallearn.assignments a on a.id=s.assignment_id where s.id=$1",
            [id],
          )
        ).rows[0].arm_key;
        seen.add(arm);
        await expect(region.locator("[data-concept]")).toHaveCount(
          arm === "chunked" ? 1 : arm === "grouped" ? 3 : 5,
        );
        await expect
          .poll(
            async () =>
              (
                await db.query(
                  "select presentation_exposures from visuallearn.sessions where id=$1",
                  [id],
                )
              ).rows[0].presentation_exposures,
          )
          .toBe(1);
        await page.reload();
        await expect(region).toBeVisible();
        await expect
          .poll(
            async () =>
              (
                await db.query(
                  "select presentation_exposures from visuallearn.sessions where id=$1",
                  [id],
                )
              ).rows[0].presentation_exposures,
          )
          .toBe(2);
        for (;;) {
          const text = await page.getByText(/^GROUP \d OF \d$/).innerText();
          const numbers = text.match(/\d/g)!.map(Number);
          if (numbers[0] === numbers[1]) break;
          await page.getByRole("button", { name: "Next group" }).click();
          await expect(
            page.getByText(`GROUP ${numbers[0] + 1} OF ${numbers[1]}`, {
              exact: true,
            }),
          ).toBeVisible();
        }
        await page.getByRole("button", { name: "Complete lesson" }).click();
        await completeWritten(page);
        await answerAll(page);
        await page.getByRole("button", { name: "Submit assessment" }).click();
        await fillF3(page);
        await page
          .getByRole("button", { name: "Submit questionnaire" })
          .click();
        await expect(
          page.getByRole("heading", { name: "Thank you. See you in an hour." }),
        ).toBeVisible();
        expect((await api(page, "assessment/plus_60m")).status).toBe(409);
        if (number === 2) {
          await shiftFollowup(id, 61);
          await page.reload();
          await page
            .getByRole("button", { name: "Check follow-up availability" })
            .click();
          await completeWritten(page, "SYNTHETIC E3 delayed");
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
        }
        const metrics = (
          await db.query(
            "select active_time_ms,exposure_measure_version,study_time_policy,visited_segments from visuallearn.sessions where id=$1",
            [id],
          )
        ).rows[0];
        expect(Number(metrics.active_time_ms)).toBeGreaterThan(0);
        expect(metrics).toMatchObject({
          exposure_measure_version: "visible-interval-v1",
          study_time_policy: "self-paced-no-minimum-v1",
        });
        expect([...metrics.visited_segments].sort()).toEqual([0, 1, 2, 3, 4]);
        await api(page, "withdraw", {});
        expect((await api(page, "session")).status).toBe(401);
      } finally {
        await context.close();
      }
    }
    expect([...seen].sort()).toEqual(["all-at-once", "chunked", "grouped"]);
  } finally {
    await db.query(
      "update visuallearn.experiments set enabled=false,status='draft',content_approved=false,ethics_approved=false,pilot_reviewed=false,pilot_contract_version=null,study_time_policy=null where id='E3'",
    );
  }
});
