// Connected SYNTHETIC participant workflow: browser → Next.js API → local
// Supabase PostgreSQL (runtime login). No HTTP mocks. Time is advanced only by
// shifting the SYNTHETIC session's stored server timestamps in the test DB.
import { test, expect, type BrowserContext, type Page } from "@playwright/test";
import {
  BASE,
  answerAll,
  api,
  completeWritten,
  db,
  enroll,
  fillF3,
  finishLesson,
  sessionId,
  shiftFollowup,
} from "./support";
test.describe.configure({ mode: "serial" });
const shared: { a?: BrowserContext; b?: BrowserContext; pa?: Page; pb?: Page; aId?: string; bId?: string } = {};
const leaks: string[] = [];
function watchForKeys(page: Page) {
  page.on("response", async (r) => {
    if (!r.url().includes("/api/study/")) return;
    const text = await r.text().catch(() => "");
    if (/"correct\w*"|rationale|anchors|maxScore|correctCycle|correctLabels/.test(text)) leaks.push(r.url());
  });
}
test.afterAll(async () => {
  await shared.a?.close().catch(() => {});
  await shared.b?.close().catch(() => {});
});
test("two SYNTHETIC participants enroll and are allocated at the same moment", async ({ browser }) => {
  shared.a = await browser.newContext();
  shared.b = await browser.newContext();
  shared.pa = await shared.a.newPage();
  shared.pb = await shared.b.newPage();
  watchForKeys(shared.pa);
  await Promise.all([enroll(shared.pa), enroll(shared.pb)]);
  shared.aId = (await sessionId(shared.a))!;
  shared.bId = (await sessionId(shared.b))!;
  expect(shared.aId).not.toBe(shared.bId);
  await Promise.all([answerAll(shared.pa), answerAll(shared.pb)]);
  await Promise.all(
    [shared.pa, shared.pb].map((p) => p.getByRole("button", { name: "Submit assessment" }).click()),
  );
  await expect(shared.pa.getByText("CHAPTER 1 OF 5", { exact: true })).toBeVisible();
  await expect(shared.pb.getByText("CHAPTER 1 OF 5", { exact: true })).toBeVisible();
  const arms = await db.query(
    "select s.id,a.arm_key,p.consent_version from visuallearn.sessions s join visuallearn.assignments a on a.id=s.assignment_id join visuallearn.participants p on p.id=s.participant_id where s.id=any($1)",
    [[shared.aId, shared.bId]],
  );
  expect(arms.rows).toHaveLength(2);
  expect(arms.rows[0].arm_key).not.toBe(arms.rows[1].arm_key);
  expect(arms.rows.every((r) => r.consent_version === "SYNTHETIC-LOCAL-CONSENT")).toBe(true);
});
test("refresh and a second tab keep the same condition, chapter and single assignment", async () => {
  const page = shared.pa!;
  await page.getByRole("button", { name: "Next chapter" }).click();
  await page.getByRole("button", { name: "Next chapter" }).click();
  await expect(page.getByText("CHAPTER 3 OF 5", { exact: true })).toBeVisible();
  const tiers = async (p: Page) => ({
    supportive: await p.locator('[data-tier="supportive"]').count(),
    decorative: await p.locator('[data-tier="decorative"]').count(),
  });
  const before = await tiers(page);
  await page.reload();
  await expect(page.getByText("CHAPTER 3 OF 5", { exact: true })).toBeVisible();
  expect(await tiers(page)).toEqual(before);
  const arm = (await db.query("select a.arm_key from visuallearn.sessions s join visuallearn.assignments a on a.id=s.assignment_id where s.id=$1", [shared.aId])).rows[0].arm_key;
  expect(before.supportive > 0).toBe(arm !== "low");
  expect(before.decorative > 0).toBe(arm === "high");
  const second = await shared.a!.newPage();
  await second.goto("/study/session");
  await expect(second.getByText("CHAPTER 3 OF 5", { exact: true })).toBeVisible();
  expect(await tiers(second)).toEqual(before);
  await second.close();
  const n = await db.query("select count(*)::int n from visuallearn.assignments a join visuallearn.sessions s on s.participant_id=a.participant_id where s.id=$1", [shared.aId]);
  expect(n.rows[0].n).toBe(1);
});
test("a network failure keeps answers, retry saves once, and a replayed submission is ignored", async () => {
  const page = shared.pa!;
  await finishLesson(page);
  await completeWritten(page);
  await answerAll(page);
  let failed = false;
  await page.route("**/api/study/assessment/immediate", async (route) => {
    if (route.request().method() === "POST" && !failed) {
      failed = true;
      await route.abort("internetdisconnected");
    } else await route.continue();
  });
  await page.getByRole("button", { name: "Submit assessment" }).click();
  await expect(page.locator(".form-error")).toBeVisible();
  await expect(page.getByText("8 of 8 answered", { exact: true })).toBeVisible();
  await page.unroute("**/api/study/assessment/immediate");
  await page.getByRole("button", { name: "Submit assessment" }).click();
  await expect(page.getByRole("heading", { name: "Your experience." })).toBeVisible();
  const replay = await api(page, "assessment/immediate", {
    answers: {},
    freeRecall: "SYNTHETIC replay attempting to overwrite the stored answer.",
    scenario: "SYNTHETIC replay attempting to overwrite the stored scenario.",
  });
  expect(replay.body).toMatchObject({ accepted: true, alreadySubmitted: true });
  const rows = await db.query(
    "select free_recall,scenario_response,correct,item_scores from visuallearn.assessment_attempts where session_id=$1 and timepoint='immediate'",
    [shared.aId],
  );
  expect(rows.rows).toHaveLength(1);
  expect(rows.rows[0].free_recall).toMatch(/^SYNTHETIC: evaporation/);
  expect(Object.keys(rows.rows[0].item_scores)).toHaveLength(8);
});
test("questionnaire drafts survive refresh; the return link restores the session after the browser closes", async ({ browser }) => {
  const page = shared.pa!;
  for (const name of ["clarity", "overload", "support"]) await page.locator(`input[name="${name}"]`).nth(3).check();
  await page.reload();
  await expect(page.getByText("3 of 10 required answered", { exact: true })).toBeVisible();
  await expect(page.locator('input[name="clarity"]').nth(3)).toBeChecked();
  await fillF3(page);
  await page.getByRole("button", { name: "Submit questionnaire" }).click();
  await expect(page.getByRole("heading", { name: "Thank you. See you in an hour." })).toBeVisible();
  await page.getByRole("button", { name: "Create return link" }).click();
  const link = await page.getByLabel("Private return link").inputValue();
  expect(link).toMatch(/^http:\/\/127\.0\.0\.1:3100\/study\/session#[A-Za-z0-9_-]{43}$/);
  const token = link.split("#")[1];
  const stored = await db.query("select count(*)::int n from visuallearn.return_tokens where token_hash=$1", [token]);
  expect(stored.rows[0].n).toBe(0); // only a hash of the token is stored
  await shared.a!.close(); // browser closure: cookies and tab storage are gone
  shared.a = await browser.newContext();
  const fresh = await shared.a.newPage();
  watchForKeys(fresh);
  // A participant device clock two hours ahead must not unlock anything.
  await fresh.clock.install({ time: new Date(Date.now() + 2 * 60 * 60_000) });
  await fresh.goto(link);
  await expect(fresh.getByRole("heading", { name: "Thank you. See you in an hour." })).toBeVisible();
  expect(fresh.url()).not.toContain("#");
  expect(await sessionId(shared.a)).toBe(shared.aId);
  await expect(fresh.getByText(/Available in about (59|60) minutes/)).toBeVisible();
  await fresh.getByRole("button", { name: "Check follow-up availability" }).click();
  await expect(fresh.locator('.form-error[role="alert"]')).toContainText("not available yet");
  shared.pa = fresh;
});
test("development clock controls cannot change real eligibility", async () => {
  const page = shared.pa!;
  const research: string[] = [];
  const listener = (r: { url(): string }) => {
    if (r.url().includes("/api/study/")) research.push(r.url());
  };
  page.on("request", listener);
  await page.goto("/dev/study");
  await page.evaluate(() =>
    localStorage.setItem(
      "visuallearn-SYNTHETIC-local-study-v2",
      JSON.stringify({
        kind: "SYNTHETIC", version: 2, publicCode: "SYNTHETIC-CLOCK", condition: "low",
        state: "waiting_60m", progress: 4, visited: [0, 1, 2, 3, 4], offsetMs: 0,
        lessonCompletedAt: new Date().toISOString(), submissions: {}, surveys: {}, eventCount: 0,
      }),
    ),
  );
  await page.reload();
  await page.getByRole("button", { name: "Advance to +60 minutes" }).click();
  await page.getByRole("button", { name: "Advance past deadline" }).click();
  expect(research).toEqual([]);
  page.off("request", listener);
  await page.goto("/study/session");
  await page.getByRole("button", { name: "Check follow-up availability" }).click();
  await expect(page.locator('.form-error[role="alert"]')).toContainText("not available yet");
  const before = await api(page, "assessment/plus_60m");
  expect(before.status).toBe(409);
  const opened = await db.query("select count(*)::int n from visuallearn.assessment_attempts where session_id=$1 and timepoint='plus_60m'", [shared.aId]);
  expect(opened.rows[0].n).toBe(0);
});
test("the server opens form C at +60 minutes and records it in-window exactly once", async () => {
  const page = shared.pa!;
  await shiftFollowup(shared.aId!, 61);
  await page.reload();
  await expect(page.getByText("Your return window is open", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Check follow-up availability" }).click();
  await expect(page.getByRole("textbox", { name: /Without replaying/ })).toBeVisible();
  await completeWritten(page, "SYNTHETIC delayed");
  await answerAll(page);
  await page.getByRole("button", { name: "Submit assessment" }).click();
  await page.getByLabel("Since the lesson, did you review the topic anywhere?").selectOption("yes");
  await page.getByLabel("Since the lesson, did you discuss the material with anyone?").selectOption("no");
  await page.locator('input[name="confidence"]').nth(2).check();
  await page.locator('input[name="recallEffort"]').nth(3).check();
  await page.getByRole("button", { name: "Submit questionnaire" }).click();
  await expect(page.locator(".form-error")).toContainText("Choose at least one source");
  await page.getByLabel("Notes", { exact: true }).check();
  await page.getByRole("button", { name: "Submit questionnaire" }).click();
  await expect(page.getByRole("heading", { name: "Your participation is complete." })).toBeVisible();
  const f = await db.query("select status,completed_at from visuallearn.scheduled_followups where session_id=$1", [shared.aId]);
  expect(f.rows[0].status).toBe("completed_in_window");
  const s = await db.query("select answers_json from visuallearn.survey_submissions where session_id=$1 and form_key='F5'", [shared.aId]);
  expect(s.rows[0].answers_json).toMatchObject({ reviewed: "yes", sources: ["notes"], discussed: "no" });
  expect(leaks).toEqual([]);
});
test("an expired follow-up is refused, then withdrawal blocks all access", async () => {
  const page = shared.pb!;
  for (const segment of [1, 2, 3, 4]) expect((await api(page, "progress", { segment })).status).toBe(200);
  expect((await api(page, "complete", {})).status).toBe(200);
  await page.reload();
  await completeWritten(page);
  await answerAll(page);
  await page.getByRole("button", { name: "Submit assessment" }).click();
  await fillF3(page);
  await page.getByRole("button", { name: "Submit questionnaire" }).click();
  await expect(page.getByRole("heading", { name: "Thank you. See you in an hour." })).toBeVisible();
  await shiftFollowup(shared.bId!, 91);
  await page.reload();
  await expect(page.getByText("Your return window has expired", { exact: true })).toBeVisible();
  const late = await api(page, "assessment/plus_60m");
  expect(late.status).toBe(409);
  expect(late.body.error.code).toBe("EXPIRED");
  const cookie = (await shared.b!.cookies()).find((c) => c.name === "visuallearn_session")!;
  await page.getByText("Withdraw from the study").click();
  await page.getByLabel("I understand and want to withdraw.").check();
  await page.getByRole("button", { name: "Confirm withdrawal" }).click();
  await expect(page.getByRole("heading", { name: "You have withdrawn." })).toBeVisible();
  expect((await shared.b!.cookies()).some((c) => c.name === "visuallearn_session")).toBe(false);
  await shared.b!.addCookies([cookie]);
  const after = await api(page, "session");
  expect(after.status).toBe(403);
  expect(after.body.error.code).toBe("WITHDRAWN");
  const w = await db.query("select p.withdrawn_at is not null w,f.status from visuallearn.sessions s join visuallearn.participants p on p.id=s.participant_id join visuallearn.scheduled_followups f on f.session_id=s.id where s.id=$1", [shared.bId]);
  expect(w.rows[0]).toEqual({ w: true, status: "withdrawn" });
});
test("a participant cannot reach another participant's records", async ({ browser }) => {
  const c = await browser.newContext();
  const page = await c.newPage();
  await enroll(page);
  const own = await api(page, "session");
  const code = (await db.query("select p.public_code from visuallearn.sessions s join visuallearn.participants p on p.id=s.participant_id where s.id=$1", [shared.aId])).rows[0].public_code;
  expect(own.body.publicCode).not.toBe(code);
  // Query parameters and bodies never select a session.
  const probe = await page.request.get(`${BASE}/api/study/session?id=${shared.aId}&sessionId=${shared.aId}`);
  expect((await probe.json()).publicCode).toBe(own.body.publicCode);
  // A cookie re-pointed at participant A (signature kept) is rejected.
  const mine = (await c.cookies()).find((x) => x.name === "visuallearn_session")!;
  const [payload, sig] = mine.value.split(".");
  const data = JSON.parse(Buffer.from(payload, "base64url").toString());
  const forged = Buffer.from(JSON.stringify({ ...data, id: shared.aId })).toString("base64url");
  for (const value of [`${forged}.${sig}`, forged, `${forged}.`]) {
    await c.clearCookies();
    await c.addCookies([{ ...mine, value }]);
    const r = await api(page, "session");
    expect(r.status).toBe(401);
    expect(JSON.stringify(r.body)).not.toContain(code);
  }
  await c.close();
});
