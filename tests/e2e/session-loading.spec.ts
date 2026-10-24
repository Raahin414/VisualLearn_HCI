import { test, expect, type Request } from "@playwright/test";
import { lesson } from "../../lib/content/lesson";

// HTTP contract fixture only. Simulates a stale initial response racing a
// newer session load; real ownership/allocation is covered by connected tests.
test("an obsolete initial response cannot replace the current lesson", async ({
  page,
}, info) => {
  let requests = 0;
  let obsolete: Request | undefined;
  let release!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  let baselineReads = 0;
  const state = {
    publicCode: "SYNTHETIC-LOAD-RACE",
    experimentId: "E1",
    state: "lesson_active",
    progress: 2,
    visited: [0, 1, 2],
    followup: null,
    serverTime: new Date().toISOString(),
  };
  await page.route("**/api/study/**", async (route) => {
    const action = new URL(route.request().url()).pathname.split(
      "/api/study/",
    )[1];
    let body: unknown = { accepted: true };
    if (action === "session") {
      const first = ++requests === 1;
      if (first && info.project.name !== "chromium-production") {
        obsolete = route.request();
        await held;
        body = { ...state, state: "enrolled", progress: 0, visited: [] };
      } else body = state;
    } else if (action === "lesson") {
      body = {
        lesson,
        condition: "medium",
        presentation: {
          kind: "density",
          version: "SYNTHETIC",
          density: "medium",
        },
        progress: 2,
        visited: [0, 1, 2],
      };
    } else if (action === "assessment/pre") {
      baselineReads++;
      body = {
        questions: Array.from({ length: 8 }, (_, index) => ({
          id: `SYNTHETIC-${index}`,
          type: "mcq",
          stem: `SYNTHETIC choice ${index}`,
          options: ["A", "B"],
        })),
      };
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(body),
    });
  });
  await page.goto("/study/session");
  await expect(page.getByText("CHAPTER 3 OF 5", { exact: true })).toBeVisible();
  if (info.project.name !== "chromium-production") {
    expect(requests).toBeGreaterThanOrEqual(2);
    const completed = page.waitForResponse(
      (response) => response.request() === obsolete,
    );
    release();
    await (await completed).finished();
    // Let the delivered response and React's rendering commit at frame
    // boundaries, rather than sleeping for an arbitrary duration.
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
  }
  await expect(page.getByText("CHAPTER 3 OF 5", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: lesson.segments[2].heading }),
  ).toBeVisible();
  expect(baselineReads).toBe(0);
});
