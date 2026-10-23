import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir } from "node:fs/promises";

for (const width of [360, 768, 1280]) {
  test(`shared forms and simulation meet accessibility/layout checks at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await mkdir("docs/screenshots/m1-after", { recursive: true });
    const routes = [
      ["auth", "/admin"],
      ["accept", "/admin/accept"],
      ["practice", "/demo/water-cycle/practice"],
      ["enroll", "/study/enroll"],
      ...(test.info().project.name.includes("production") ? [] : [["simulator", "/dev/study"]]),
    ];
    for (const [name, route] of routes) {
      await page.goto(route);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const result = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(result.violations, `${name}: WCAG A/AA rules`).toEqual([]);
      await page.screenshot({ path: `docs/screenshots/m1-after/${name}-${width}.png`, fullPage: true });
    }
    await page.goto("/");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("#main")).toBeInViewport();
  });
}
