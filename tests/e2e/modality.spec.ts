import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { lesson } from "../../lib/content/lesson";
import { answerAll } from "./helpers";
for (const arm of [
  "text-only",
  "audio-only",
  "text-diagram",
  "audio-diagram",
]) {
  test(`SYNTHETIC E2 ${arm}: canonical channels, accommodation, three widths`, async ({
    page,
    request,
  }, info) => {
    if (info.project.name === "chromium-production") {
      expect((await request.get("/dev/study")).status()).toBe(404);
      return;
    }
    const research: string[] = [];
    page.on("request", (r) => {
      if (r.url().includes("/api/study/")) research.push(r.url());
    });
    await page.goto("/dev/study");
    await page.getByLabel("Simulated experiment").selectOption("E2");
    await page.getByLabel("Simulated presentation").selectOption(arm);
    await page.getByRole("button", { name: "Start simulated session" }).click();
    await expect(
      page.getByRole("heading", { name: "Before we begin." }),
    ).toBeVisible();
    await answerAll(page);
    await page.getByRole("button", { name: "Submit assessment" }).click();
    const assigned = page.getByRole("region", {
      name: "Assigned lesson presentation",
    });
    await expect(assigned).toBeVisible();
    const audio = arm.startsWith("audio");
    const diagram = arm.endsWith("diagram");
    await expect(assigned.locator("audio")).toHaveCount(audio ? 1 : 0);
    await expect(assigned.locator('svg[role="img"]')).toHaveCount(
      diagram ? 1 : 0,
    );
    for (const width of [360, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
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
        path: `docs/screenshots/m2/${arm}-${width}.png`,
        fullPage: true,
      });
    }
    if (audio) {
      await assigned.locator("audio").evaluate((element: HTMLAudioElement) => {
        element.playbackRate = 2;
      });
      await expect
        .poll(() =>
          assigned
            .locator("audio")
            .evaluate((element: HTMLAudioElement) => element.playbackRate),
        )
        .toBe(1);
      await expect(assigned.locator(".instruction-script")).toHaveCount(0);
      await assigned
        .getByRole("button", {
          name: "Show transcript (accessibility accommodation)",
        })
        .focus();
      await page.keyboard.press("Enter");
      await expect(
        assigned.getByRole("button", { name: "Hide transcript" }),
      ).toHaveAttribute("aria-expanded", "true");
    }
    expect(
      await assigned.locator(".instruction-script p").allTextContents(),
    ).toEqual(lesson.segments[0].body.split("\n\n"));
    if (audio) {
      expect(
        (
          await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
            .analyze()
        ).violations,
      ).toEqual([]);
    }
    await page.getByRole("button", { name: "Next chapter" }).click();
    await expect(
      page.getByText("CHAPTER 2 OF 5", { exact: true }),
    ).toBeVisible();
    if (audio) await expect(page.locator(".instruction-script")).toHaveCount(0);
    await page.reload();
    await expect(
      page.getByText("CHAPTER 2 OF 5", { exact: true }),
    ).toBeVisible();
    await expect(assigned.locator("audio")).toHaveCount(audio ? 1 : 0);
    expect(research).toEqual([]);
  });
}
