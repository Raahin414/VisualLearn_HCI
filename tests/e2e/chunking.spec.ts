import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { lesson } from "../../lib/content/lesson";
import { answerAll } from "./helpers";
for (const [arm, pages] of [
  ["chunked", [[0], [1], [2], [3], [4]]],
  [
    "grouped",
    [
      [0, 1, 2],
      [3, 4],
    ],
  ],
  ["all-at-once", [[0, 1, 2, 3, 4]]],
] as const) {
  test(`SYNTHETIC E3 ${arm}: identical content, controlled media, exposure and responsive groups`, async ({
    page,
    request,
  }, info) => {
    if (info.project.name === "chromium-production") {
      expect((await request.get("/dev/study")).status()).toBe(404);
      return;
    }
    const research: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/api/study/")) research.push(request.url());
    });
    await page.goto("/dev/study");
    await page.getByLabel("Simulated experiment").selectOption("E3");
    await page.getByLabel("Simulated presentation").selectOption(arm);
    await page.getByRole("button", { name: "Start simulated session" }).click();
    await answerAll(page);
    await page.getByRole("button", { name: "Submit assessment" }).click();
    const region = page.getByRole("region", {
      name: "Assigned lesson presentation",
    });
    await expect(region.locator("[data-concept]")).toHaveCount(pages[0].length);
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
        path: `docs/screenshots/m3/${arm}-${width}.png`,
        fullPage: true,
      });
    }
    if (pages[0].length > 1) {
      const audio = region.locator("audio");
      await audio
        .nth(0)
        .evaluate((element: HTMLAudioElement) => element.play());
      await expect
        .poll(() =>
          audio.nth(0).evaluate((element: HTMLAudioElement) => element.paused),
        )
        .toBe(false);
      await audio
        .nth(1)
        .evaluate((element: HTMLAudioElement) => element.play());
      await expect
        .poll(() =>
          audio.nth(0).evaluate((element: HTMLAudioElement) => element.paused),
        )
        .toBe(true);
      await audio.nth(1).evaluate((element: HTMLAudioElement) => {
        element.playbackRate = 2;
      });
      await expect
        .poll(() =>
          audio
            .nth(1)
            .evaluate((element: HTMLAudioElement) => element.playbackRate),
        )
        .toBe(1);
      await audio
        .nth(1)
        .evaluate((element: HTMLAudioElement) => element.pause());
    }
    const words: string[] = [];
    for (let group = 0; group < pages.length; group++) {
      await expect(
        page.getByText(`GROUP ${group + 1} OF ${pages.length}`, {
          exact: true,
        }),
      ).toBeVisible();
      for (const index of pages[group]) {
        const block = region.locator(
          `[data-concept="${lesson.segments[index].id}"]`,
        );
        const text = await block.locator(".chunk-script p").allTextContents();
        expect(text).toEqual(lesson.segments[index].body.split("\n\n"));
        words.push(...text);
        await expect(block.locator("audio")).toHaveAttribute(
          "src",
          lesson.segments[index].audioSrc,
        );
      }
      if (group < pages.length - 1) {
        await page.getByRole("button", { name: "Next group" }).focus();
        await page.keyboard.press("Enter");
      }
    }
    expect(words).toEqual(
      lesson.segments.flatMap((segment) => segment.body.split("\n\n")),
    );
    await page.reload();
    await expect(
      page.getByText(`GROUP ${pages.length} OF ${pages.length}`, {
        exact: true,
      }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Complete lesson" }).click();
    await expect(page.getByText(/Part 1 of 2/)).toBeVisible();
    expect(research).toEqual([]);
  });
}
