import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir } from "node:fs/promises";
import { answerAll, completeWritten } from "./helpers";
async function exposure(page: Page) {
  await page
    .getByLabel("Since the lesson, did you review the topic anywhere?")
    .selectOption("no");
  await page
    .getByLabel("Since the lesson, did you discuss the material with anyone?")
    .selectOption("no");
  await page.locator('input[name="confidence"]').nth(2).check();
  await page.locator('input[name="recallEffort"]').nth(3).check();
  await page.getByRole("button", { name: "Submit questionnaire" }).click();
}
test("SYNTHETIC seven-day D/F6 stays separate and draft debrief stays development-only", async ({
  page,
  request,
}, info) => {
  if (info.project.name.includes("production")) {
    expect((await request.get("/dev/study")).status()).toBe(404);
    expect((await request.get("/study/debrief")).status()).toBe(404);
    return;
  }
  const writes: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/api/study/")) writes.push(r.url());
  });
  await page.goto("/dev/study");
  await expect(
    page.getByRole("heading", { name: "Draft debrief for review" }),
  ).toBeVisible();
  await page
    .getByLabel("Include optional seven-day simulation", { exact: false })
    .check();
  await page.getByRole("button", { name: "Start simulated session" }).click();
  await answerAll(page);
  await page.getByRole("button", { name: "Submit assessment" }).click();
  for (let i = 0; i < 4; i++)
    await page.getByRole("button", { name: "Next chapter" }).click();
  await page.getByRole("button", { name: "Complete lesson" }).click();
  await completeWritten(page);
  await answerAll(page);
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
    await page.locator(`input[name="${name}"]`).nth(2).check();
  await page.locator('input[name="overload"]').last().check();
  await page.locator('input[name="motion"][value="not_applicable"]').check();
  await page.getByRole("button", { name: "Submit questionnaire" }).click();
  await expect(
    page
      .getByRole("region", { name: "SYNTHETIC response-based review" })
      .getByRole("heading", { name: "Too much information at once" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Advance to +60 minutes" }).click();
  await page
    .getByRole("button", { name: "Check follow-up availability" })
    .click();
  await completeWritten(page);
  await answerAll(page);
  await page.getByRole("button", { name: "Submit assessment" }).click();
  await exposure(page);
  await expect(
    page.getByRole("heading", { name: "Your seven-day follow-up." }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Check follow-up availability" })
    .click();
  await expect(page.locator(".form-error")).toContainText(
    "seven-day follow-up is not available yet",
  );
  await page.getByRole("button", { name: "Advance to +7 days" }).click();
  await page
    .getByRole("button", { name: "Check follow-up availability" })
    .click();
  await expect(page.locator('textarea[name="freeRecall"]')).toHaveValue("");
  await completeWritten(page, "SYNTHETIC seven-day");
  await answerAll(page);
  await page.reload();
  await page
    .getByRole("button", { name: "Check follow-up availability" })
    .click();
  await expect(
    page.getByText("8 of 8 answered", { exact: true }),
  ).toBeVisible();
  await mkdir("docs/screenshots/m4", { recursive: true });
  for (const width of [360, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze()
      ).violations,
    ).toEqual([]);
    await page.screenshot({
      path: `docs/screenshots/m4/seven-day-${width}.png`,
      fullPage: true,
    });
    await page.locator("#draft-debrief").screenshot({ path: `docs/screenshots/m4/debrief-${width}.png` });
    await page.getByRole("region", { name: "SYNTHETIC response-based review" }).screenshot({ path: `docs/screenshots/m4/response-review-${width}.png` });
  }
  await page.getByRole("button", { name: "Submit assessment" }).click();
  await exposure(page);
  await expect(
    page.getByRole("heading", { name: "Simulated workflow complete." }),
  ).toBeVisible();
  expect(writes).toEqual([]);
});
