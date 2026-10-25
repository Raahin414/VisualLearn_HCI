import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir } from "node:fs/promises";
import { lesson } from "../../lib/content/lesson";

test("only the density study is exposed, with a clear student entry", async ({
  page,
  request,
}) => {
  await page.goto("/research");
  await expect(
    page.getByRole("heading", { name: "One lesson. Three visual densities." }),
  ).toBeVisible();
  await expect(page.locator(".density-tier")).toHaveCount(3);
  await expect(
    page.getByRole("link", { name: "Participate in the study", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Return to my study", exact: true }),
  ).toBeVisible();
  expect((await request.get("/study/enroll?study=E2")).status()).toBe(404);
  expect((await request.get("/study/enroll?study=E3")).status()).toBe(404);
});

for (const width of [360, 768, 1280]) {
  test(`three density layouts preserve text/audio and access at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/demo/water-cycle");
    await expect(
      page.getByRole("button", { name: "Chapter 1: The big picture" }),
    ).toBeEnabled();
    await mkdir("docs/screenshots/e1", { recursive: true });
    const audioPositions: number[] = [];
    for (const [condition, panels] of [
      ["low", 0],
      ["medium", 2],
      ["high", 4],
    ] as const) {
      await page
        .getByLabel("Demo visual density", { exact: true })
        .selectOption(condition);
      await expect(page.locator(".density-process")).toHaveCount(panels);
      await expect(page.locator(".density-decoration")).toHaveCount(
        condition === "high" ? 1 : 0,
      );
      await expect(page.locator(".transcript-content p")).toHaveText(
        lesson.segments[0].body.split("\n\n"),
      );
      await expect(page.locator("audio")).toHaveAttribute(
        "src",
        lesson.segments[0].audioSrc,
      );
      audioPositions.push(
        (await page.locator(".narration-player").boundingBox())!.y,
      );
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
        path: `docs/screenshots/e1/lesson-${condition}-${width}.png`,
        fullPage: true,
      });
    }
    expect(
      Math.max(...audioPositions) - Math.min(...audioPositions),
    ).toBeLessThan(2);
  });
}
