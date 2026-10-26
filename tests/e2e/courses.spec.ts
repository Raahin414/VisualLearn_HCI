import { test, expect } from "@playwright/test";
const slugs = ["water-cycle", "photosynthesis", "electric-circuits", "human-digestion", "solar-system"];
test("all five courses load and only visual density changes in preview", async ({ page }) => {
  await page.goto("/courses");
  await expect(page.locator(".catalog-card")).toHaveCount(5);
  for (const slug of slugs) {
    await page.goto(`/courses/${slug}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const lesson = page.locator(".course-panel[aria-label='Course lesson']");
    const text = await lesson.locator("p").last().innerText();
    await page.getByLabel("Preview visual density").selectOption("low");
    await expect(page.locator(".course-support-card")).toHaveCount(0);
    await page.getByLabel("Preview visual density").selectOption("medium");
    await expect(page.locator(".course-support-card")).toHaveCount(2);
    await page.getByLabel("Preview visual density").selectOption("high");
    await expect(page.locator(".course-support-card")).toHaveCount(4);
    expect(await lesson.locator("p").last().innerText()).toBe(text);
    await expect(page.locator(".course-question")).toHaveCount(4);
    await expect(page.getByText("Recorded participation is closed.")).toBeVisible();
  }
});
test("recording and identity view stay closed without configuration", async ({ request }) => {
  const start = await request.post("/api/course/start", { headers: { Origin: "http://127.0.0.1:3000" }, data: {} });
  expect(start.status()).toBe(503);
  const records = await request.get("/api/admin/course-records");
  expect(records.status()).toBe(401);
});
