import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";
test("homepage, catalog and course navigation are functional", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Science,",
  );
  await page.getByRole("link", { name: "Explore the courses", exact: true }).click();
  await expect(page).toHaveURL(/\/courses$/);
  await page.locator('.catalog-card[href="/courses/water-cycle"]').click();
  // A cold development server may compile this route after the click.
  await expect(page).toHaveURL(/\/courses\/water-cycle$/, { timeout: 30000 });
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "The Water Cycle",
  );
  await page.getByRole("link", { name: /Start the full narrated Water Cycle demo/ }).click();
  await expect(page).toHaveURL(/\/demo\/water-cycle$/, { timeout: 30000 });
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "A journey without an end",
  );
});
test("narration reports ready when metadata arrives before hydration", async ({ page }) => {
  let releaseScripts!: () => void;
  const scriptsReady = new Promise<void>((resolve) => { releaseScripts = resolve; });
  // Deliver the real HTML/audio first, then the real application scripts.
  // This reproduces cached media with delayed hydration without faking events.
  await page.route("**/_next/static/**/*.js", async (route) => {
    await scriptsReady;
    await route.continue();
  });
  try {
    await page.goto("/demo/water-cycle", { waitUntil: "commit" });
    await expect.poll(() => page.locator("audio").evaluate((audio) => (audio as HTMLAudioElement).readyState)).toBeGreaterThanOrEqual(1);
    await expect(page.getByRole("button", { name: "Replay", exact: true })).toBeDisabled();
    releaseScripts();
    await expect(page.locator(".media-status")).toContainText("Narration ready");
    await expect(page.getByRole("button", { name: "Replay", exact: true })).toBeEnabled();
  } finally {
    releaseScripts();
  }
});

test("unavailable narration leaves the transcript usable and replay disabled", async ({ page }) => {
  await page.route("**/audio/water-cycle/*.wav", (route) => route.fulfill({ status: 404, body: "" }));
  await page.goto("/demo/water-cycle");
  await expect(page.locator(".narration-player .form-error")).toContainText("Audio could not load");
  await expect(page.getByRole("button", { name: "Replay", exact: true })).toBeDisabled();
  await expect(page.locator(".transcript-content")).toBeVisible();
  await expect(page.locator(".transcript-content")).toContainText("Water moves between");
});

test("density changes only declared SVG layers and survives refresh", async ({
  page,
}) => {
  await page.goto("/demo/water-cycle");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "A journey without an end",
  );
  const transcript = await page.locator(".transcript-content").innerText();
  const audio = await page.locator("audio").getAttribute("src");
  await page.getByLabel("Demo visual density").selectOption("low");
  await expect(page.locator('[data-tier="supportive"]')).toHaveCount(0);
  await page.getByLabel("Demo visual density").selectOption("high");
  await expect(page.locator('[data-tier="decorative"]')).toHaveCount(1);
  expect(await page.locator(".transcript-content").innerText()).toBe(
    transcript,
  );
  expect(await page.locator("audio").getAttribute("src")).toBe(audio);
  await page.getByRole("button", { name: "Next chapter" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "From water to water vapor",
  );
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "From water to water vapor",
  );
  await expect(page.getByLabel("Demo visual density")).toHaveValue("high");
  await expect
    .poll(() =>
      page.locator("audio").evaluate((a) => (a as HTMLAudioElement).duration),
    )
    .toBeGreaterThan(30);
  await page.getByRole("button", { name: "Reset demo" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "A journey without an end",
  );
});
test("the complete demo ends in a server-scored practice quiz without research writes", async ({
  page,
}) => {
  const researchRequests: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/api/study/")) researchRequests.push(r.url());
  });
  await page.goto("/demo/water-cycle");
  for (let i = 0; i < 4; i++)
    await page.getByRole("button", { name: "Next chapter" }).click();
  await page.getByRole("link", { name: /Try the practice quiz/ }).click();
  const groups = page.locator("fieldset");
  await expect(groups).toHaveCount(8);
  for (let i = 0; i < 8; i++)
    await groups.nth(i).locator("input").first().check();
  await page.getByRole("button", { name: "Check my understanding" }).click();
  await expect(page.getByRole("status")).toContainText(
    "of 8 questions correctly",
  );
  expect(researchRequests).toHaveLength(0);
});
test("research and admin fail closed with no configured services", async ({
  page,
  request,
}) => {
  await page.goto("/study/enroll");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Research enrollment is closed.",
  );
  await page.goto("/admin");
  await expect(
    page.getByText("Administrator authentication is not configured."),
  ).toBeVisible();
  const response = await request.get("/api/admin/stats");
  expect(response.status()).toBe(401);
  const enroll = await request.post("/api/study/enroll", {
    headers: { Origin: "http://127.0.0.1:3000" },
    data: {},
  });
  expect(enroll.status()).toBe(503);
  const crossOrigin = await request.post("/api/study/enroll", {
    headers: { Origin: "https://untrusted.example" },
    data: {},
  });
  expect(crossOrigin.status()).toBe(403);
});
test("learner pages and API responses do not expose answer keys", async ({
  page,
  request,
}) => {
  await page.goto("/demo/water-cycle/practice");
  const html = await page.content();
  expect(html).not.toContain("correctAnswer");
  expect(html).not.toContain("rationale");
  const bad = await request.post("/api/demo/practice", {
    headers: { Origin: "http://127.0.0.1:3000" },
    data: {},
  });
  expect(bad.status()).toBe(400);
});
for (const width of [360, 768, 1280])
  test(`responsive pages and keyboard accessibility at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const route of [
      "/",
      "/courses",
      "/courses/water-cycle",
      "/demo/water-cycle",
      "/demo/water-cycle/practice",
      "/research",
      "/study/enroll",
      "/admin",
    ]) {
      await page.goto(route);
      await page.getByRole("heading", { level: 1 }).waitFor();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(
        results.violations.map((v) => ({
          route,
          id: v.id,
          nodes: v.nodes.map((n) => n.target),
        })),
      ).toEqual([]);
    }
    await page.goto("/demo/water-cycle");
    await page.keyboard.press("Tab");
    await expect(
      page.getByRole("link", { name: "Skip to content" }),
    ).toBeFocused();
    await page.getByRole("heading", { level: 1 }).click();
    await expect.poll(() => page.locator("audio").evaluate((audio) => (audio as HTMLAudioElement).readyState)).toBeGreaterThanOrEqual(1);
    await expect(page.locator(".media-status")).toContainText("Narration ready");
    const target = path.resolve("docs/screenshots");
    await mkdir(target, { recursive: true });
    for (const condition of ["low", "medium", "high"]) {
      await page.getByLabel("Demo visual density").selectOption(condition);
      await page.screenshot({
        path: path.join(target, `lesson-${condition}-${width}.png`),
        fullPage: true,
      });
    }
    await page.goto("/");
    await page.screenshot({
      path: path.join(target, `home-${width}.png`),
      fullPage: true,
    });
  });
