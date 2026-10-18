import type { Page } from "@playwright/test";
/** Completes every objective item with a well-formed (not necessarily correct) answer. */
export async function answerAll(page: Page) {
  const groups = page.locator("fieldset.quiz-card");
  const count = await groups.count();
  for (let i = 0; i < count; i++) {
    const group = groups.nth(i);
    const selects = group.locator("select");
    const n = await selects.count();
    if (n === 0) {
      await group.locator('input[type="radio"]').first().check();
      continue;
    }
    // Ordering uses each step once; labeling accepts any listed process.
    for (let j = 0; j < n; j++)
      await selects.nth(j).selectOption(String(j));
  }
}
/** Fills part 1 (free recall and, when shown, the scenario) and continues. */
export async function completeWritten(page: Page, label = "SYNTHETIC") {
  await page
    .locator('textarea[name="freeRecall"]')
    .fill(
      `${label}: evaporation, condensation, precipitation and collection connect in a repeating cycle.`,
    );
  const scenario = page.locator('textarea[name="scenario"]');
  if (await scenario.count())
    await scenario.fill(
      `${label}: warm moving air helps liquid water evaporate into vapor.`,
    );
  await page.getByRole("button", { name: "Continue to part 2" }).click();
}
