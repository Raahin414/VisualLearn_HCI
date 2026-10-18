import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { answerAll, completeWritten } from "./helpers";
test("practice drafts survive refresh and failed submission, then clear after success", async ({
  page,
}) => {
  await page.goto("/demo/water-cycle/practice");
  await page.getByRole("button", { name: "Check my understanding" }).click();
  await expect(page.locator(".form-error")).toContainText(
    "8 remaining questions",
  );
  await expect(
    page.locator("fieldset.quiz-card").first().locator("input").first(),
  ).toBeFocused();
  await page
    .locator("fieldset.quiz-card")
    .first()
    .locator("input")
    .first()
    .check();
  await expect(
    page.getByText("1 of 8 answered", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.locator("fieldset.quiz-card").first().locator("input").first(),
  ).toBeChecked();
  await answerAll(page);
  let attempts = 0;
  await page.route("**/api/demo/practice", async (route) => {
    attempts++;
    if (attempts === 1)
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({
          error: { message: "Temporary scoring failure. Please retry." },
        }),
      });
    else await route.continue();
  });
  await page.getByRole("button", { name: "Check my understanding" }).click();
  await expect(page.locator(".form-error")).toContainText(
    "Temporary scoring failure",
  );
  await expect(
    page.getByText("8 of 8 answered", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Check my understanding" }).click();
  await expect(page.getByRole("status")).toContainText(
    "of 8 questions correctly",
  );
  expect(
    await page.evaluate(() =>
      sessionStorage.getItem("visuallearn-practice-P-v1"),
    ),
  ).toBeNull();
});
test("development-only simulation demonstrates real screens with no research network writes", async ({
  page,
  request,
}, testInfo) => {
  const response = await request.get("/dev/study");
  if (testInfo.project.name === "chromium-production") {
    expect(response.status()).toBe(404);
    await page.goto("/dev/study");
    await expect(page.getByText("Walk through the study.")).toHaveCount(0);
    return;
  }
  expect(response.status()).toBe(200);
  const researchRequests: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/api/study/")) researchRequests.push(r.url());
  });
  await page.goto("/dev/study");
  await expect(page.getByText("No simulated session yet.")).toBeVisible();
  await page.getByLabel("Simulated visual condition").selectOption("high");
  await page.getByRole("button", { name: "Start simulated session" }).click();
  await expect(
    page.getByRole("heading", { name: "Before we begin." }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Advance to +60 minutes" }),
  ).toBeDisabled();
  await answerAll(page);
  await page.getByRole("button", { name: "Submit assessment" }).click();
  await expect(
    page.getByRole("heading", { name: "A journey without an end" }),
  ).toBeVisible();
  await expect(page.locator('[data-tier="decorative"]')).toHaveCount(1);
  await expect(page.getByLabel("Demo visual density")).toHaveCount(0);
  for (let i = 0; i < 4; i++)
    await page.getByRole("button", { name: "Next chapter" }).click();
  await page.getByRole("button", { name: "Complete lesson" }).click();
  const recall = page.getByRole("textbox", { name: /Without looking back/ });
  await recall.fill(
    "SYNTHETIC: evaporation, condensation, precipitation and collection connect in a cycle.",
  );
  await page.getByRole("button", { name: "Continue to part 2" }).click();
  await expect(page.locator(".form-error")).toContainText("scenario");
  await expect(page.locator('textarea[name="scenario"]')).toBeFocused();
  await page.reload();
  await expect(
    page.getByRole("textbox", { name: /Without looking back/ }),
  ).toHaveValue(/SYNTHETIC:/);
  await completeWritten(page);
  await expect(page.getByText("Part 1: saved")).toBeVisible();
  await expect(page.locator('textarea[name="freeRecall"]')).toHaveCount(0);
  await answerAll(page);
  await page.reload();
  await expect(
    page.getByText("8 of 8 answered", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Submit assessment" }).click();
  for (const name of ["clarity", "overload", "support", "distraction"])
    await page.locator(`input[name="${name}"]`).first().check();
  await page.locator('input[name="motion"][value="not_applicable"]').check();
  await page.getByRole("button", { name: "Submit questionnaire" }).click();
  await expect(page.locator(".form-error")).toContainText("5 remaining");
  await expect(page.locator('input[name="pacing"]').first()).toBeFocused();
  await page.reload();
  await expect(
    page.getByText("5 of 10 required answered", { exact: true }),
  ).toBeVisible();
  await expect(
    page.locator('input[name="motion"][value="not_applicable"]'),
  ).toBeChecked();
  for (const name of [
    "pacing",
    "audio",
    "color",
    "acceptability",
    "mentalEffort",
  ])
    await page.locator(`input[name="${name}"]`).first().check();
  await page.getByRole("button", { name: "Submit questionnaire" }).click();
  await expect(
    page.getByRole("heading", { name: "Thank you. See you in an hour." }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Check follow-up availability" })
    .click();
  await expect(page.locator('.form-error[role="alert"]')).toContainText(
    "not available yet",
  );
  await page.getByRole("button", { name: "Advance to +60 minutes" }).click();
  await expect(
    page.getByText("Your return window is open", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Check follow-up availability" })
    .click();
  await expect(
    page.getByRole("textbox", { name: /Without replaying/ }),
  ).toBeVisible();
  await completeWritten(page, "SYNTHETIC delayed");
  await answerAll(page);
  await page.getByRole("button", { name: "Submit assessment" }).click();
  await page
    .getByLabel("Since the lesson, did you review the topic anywhere?")
    .selectOption("yes");
  await page
    .getByLabel("Since the lesson, did you discuss the material with anyone?")
    .selectOption("no");
  await page.locator('input[name="confidence"]').first().check();
  await page.locator('input[name="recallEffort"]').first().check();
  await page.getByRole("button", { name: "Submit questionnaire" }).click();
  await expect(page.locator('.form-error[role="alert"]')).toBeVisible();
  await page.getByLabel("Notes", { exact: true }).check();
  await page.getByRole("button", { name: "Submit questionnaire" }).click();
  await expect(
    page.getByRole("heading", { name: "Simulated workflow complete." }),
  ).toBeVisible();
  await expect(page.getByText("3 / 3", { exact: true })).toBeVisible();
  expect(researchRequests).toEqual([]);
  await page.getByRole("button", { name: "Reset simulated session" }).click();
  await expect(page.getByText("No simulated session yet.")).toBeVisible();
});
test("storage restrictions do not crash the lesson or practice form", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "sessionStorage", {
      get() {
        throw new DOMException("Blocked", "SecurityError");
      },
    });
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new DOMException("Blocked", "SecurityError");
      },
    });
  });
  await page.goto("/demo/water-cycle");
  await expect(
    page.getByRole("heading", { name: "A journey without an end" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Next chapter" }).click();
  await expect(
    page.getByRole("heading", { name: "From water to water vapor" }),
  ).toBeVisible();
  await page.goto("/demo/water-cycle/practice");
  await expect(page.getByText(/Browser storage unavailable/)).toBeVisible();
  await answerAll(page);
  await page.getByRole("button", { name: "Check my understanding" }).click();
  await expect(page.getByRole("status")).toContainText(
    "of 8 questions correctly",
  );
});
test("simulation empty state is usable at 360px", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 900 });
  const response = await page.goto("/dev/study");
  if (response?.status() === 404) return;
  await expect(
    page.getByRole("button", { name: "Start simulated session" }),
  ).toBeEnabled();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(
    results.violations.map((v) => ({
      id: v.id,
      targets: v.nodes.map((n) => n.target),
    })),
  ).toEqual([]);
});
for (const width of [360, 1280])
  test(`ordering and labeling items are accessible at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    const response = await page.goto("/dev/study");
    if (response?.status() === 404) return;
    await page.getByRole("button", { name: "Start simulated session" }).click();
    const ordering = page.locator("fieldset.quiz-card").nth(4);
    await expect(ordering.locator("select")).toHaveCount(4);
    // Keyboard: focus the first ordering control and choose with arrows.
    await ordering.locator("select").first().focus();
    await page.keyboard.press("ArrowDown");
    await expect(ordering.locator("select").first()).not.toHaveValue("-1");
    const labeling = page.locator("fieldset.quiz-card").nth(5);
    await expect(labeling.getByRole("img")).toHaveAccessibleName(
      /Unlabeled water cycle diagram with 4 numbered markers/,
    );
    await expect(labeling.locator("select")).toHaveCount(4);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      results.violations.map((v) => ({
        id: v.id,
        targets: v.nodes.map((n) => n.target),
      })),
    ).toEqual([]);
    await labeling.screenshot({
      path: `docs/screenshots/assessment-labeling-${width}.png`,
    });
    await page.getByRole("button", { name: "Reset simulated session" }).click();
  });
