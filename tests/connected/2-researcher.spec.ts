// Connected researcher workflow against local Supabase Auth (GoTrue) with real
// TOTP MFA, the UUID allowlist, database-backed dashboard, exports and blind
// scoring. Runs after 1-participant.spec.ts created SYNTHETIC data.
import { createHash } from "node:crypto";
import { mkdir } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import { test, expect, type BrowserContext, type Page } from "@playwright/test";
import { BASE, db, harness, passMfa, secrets, signIn } from "./support";
test.describe.configure({ mode: "serial" });
const [one, two] = harness.researchers;
let ctxOne: BrowserContext;
let pageOne: Page;
const adminGet = (page: Page, path: string) => page.request.get(`${BASE}/api/admin/${path}`);
test.afterAll(async () => {
  await ctxOne?.close().catch(() => {});
  await db.end();
});
test("anonymous visitors get no dashboard data, exports, codebook or rating access", async ({ page }) => {
  for (const path of ["stats", "export?table=participants_deidentified", "export?table=written_responses", "codebook?format=json", "rating?kind=free_recall", "adjudication?kind=scenario"])
    expect((await adminGet(page, path)).status(), path).toBe(401);
  const post = await page.request.post(`${BASE}/api/admin/rating`, {
    data: { handle: "W-0000000000000000", kind: "free_recall", scores: {} },
    headers: { Origin: BASE },
  });
  expect(post.status()).toBe(401);
  await page.goto("/admin");
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  await expect(page.getByText("Allocation by age band")).toHaveCount(0);
});
test("non-allowlisted accounts and wrong passwords cannot sign in", async ({ page }) => {
  await signIn(page, harness.outsider);
  await expect(page.locator(".form-error")).toContainText("Unable to sign in");
  await signIn(page, { email: one.email, password: `${one.password}x` });
  await expect(page.locator(".form-error")).toContainText("Unable to sign in");
  expect((await page.context().cookies()).filter((c) => c.name.startsWith("visuallearn_admin"))).toEqual([]);
});
test("a password alone (aal1) cannot open the dashboard; TOTP enrollment is required", async ({ browser }) => {
  ctxOne = await browser.newContext();
  pageOne = await ctxOne.newPage();
  await signIn(pageOne, one);
  await expect(pageOne.getByRole("heading", { name: "Two-step verification" })).toBeVisible();
  expect((await adminGet(pageOne, "stats")).status()).toBe(401);
  // Promoting the first-factor token into the session cookie does not help.
  const pending = (await ctxOne.cookies()).find((c) => c.name === "visuallearn_admin_mfa")!;
  expect(pending.expires - Date.now() / 1000).toBeLessThanOrEqual(301);
  await ctxOne.addCookies([{ ...pending, name: "visuallearn_admin" }]);
  expect((await adminGet(pageOne, "stats")).status()).toBe(401);
  await ctxOne.clearCookies({ name: "visuallearn_admin" });
  await pageOne.getByRole("button", { name: "Set up authenticator" }).click();
  secrets[one.email] = await pageOne.getByLabel("Setup key").inputValue();
  const qr = pageOne.getByRole("img", { name: "Authenticator setup QR code" });
  await expect(qr).toBeVisible();
  // The image must actually decode, not merely exist as a broken <img>.
  await expect
    .poll(() => qr.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0))
    .toBe(true);
  expect(await qr.getAttribute("src")).toMatch(/^data:image\/svg\+xml;base64,/);
  await qr.screenshot({ path: "test-results/totp-qr.png" });
  await pageOne.getByLabel("Six-digit code from your authenticator").fill("000000");
  await pageOne.getByRole("button", { name: "Verify and continue" }).click();
  await expect(pageOne.locator(".form-error")).toContainText("not accepted");
  await passMfa(pageOne, one);
  const session = (await ctxOne.cookies()).find((c) => c.name === "visuallearn_admin")!;
  expect(session.httpOnly).toBe(true);
  expect(session.sameSite).toBe("Strict");
  expect(session.expires - Date.now() / 1000).toBeLessThanOrEqual(3601);
  const payload = JSON.parse(Buffer.from(session.value.split(".")[1], "base64url").toString());
  expect(payload.aal).toBe("aal2");
});
test("the dashboard matches the database and keeps withdrawn participants out", async () => {
  const stats = await (await adminGet(pageOne, "stats")).json();
  const live = await db.query(
    "select count(*)::int n from visuallearn.sessions s join visuallearn.participants p on p.id=s.participant_id where p.withdrawn_at is null",
  );
  expect(stats.funnel[0]).toEqual({ step: "enrolled", n: live.rows[0].n });
  expect(stats.quality.withdrawn_excluded).toBe(1);
  expect(stats.retention.reduce((n: number, r: { paired: number }) => n + r.paired, 0)).toBe(1);
  await expect(pageOne.getByRole("heading", { name: "Retention: immediate vs one hour" })).toBeVisible();
  await expect(pageOne.getByRole("heading", { name: "Data quality" })).toBeVisible();
  await mkdir("docs/screenshots/current", { recursive: true });
  for (const width of [360, 768, 1280]) {
    await pageOne.setViewportSize({ width, height: 900 });
    expect(await pageOne.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const versions = pageOne.getByRole("region", { name: "Versions in use", exact: true });
    await versions.focus();
    if (await versions.evaluate((region) => region.scrollWidth > region.clientWidth)) {
      await pageOne.keyboard.press("ArrowRight");
      await expect.poll(() => versions.evaluate((region) => region.scrollLeft)).toBeGreaterThan(0);
      await versions.evaluate((region) => { region.scrollLeft = 0; });
    }
    const result = await new AxeBuilder({ page: pageOne })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(result.violations).toEqual([]);
    // Authenticated dashboard only: no MFA QR or setup key is present.
    await pageOne.screenshot({ path: `docs/screenshots/current/dashboard-${width}.png`, fullPage: true });
  }
  await pageOne.setViewportSize({ width: 1280, height: 900 });
});
test("exports equal database rows, exclude the withdrawn participant and carry no identifiers", async () => {
  const withdrawn = await db.query(
    "select s.id session_id,p.id participant_id,p.public_code from visuallearn.sessions s join visuallearn.participants p on p.id=s.participant_id where p.withdrawn_at is not null",
  );
  const hidden = withdrawn.rows.flatMap((r) => [r.session_id, r.participant_id].map((id: string) => `VL_${createHash("sha256").update(id).digest("hex").slice(0, 24)}`));
  const codes = (await db.query("select public_code from visuallearn.participants")).rows.map((r) => r.public_code);
  const dictionary = await (await adminGet(pageOne, "codebook?format=md")).text();
  const expectedRows: Record<string, string> = {
    participants_deidentified: "select count(*)::int n from visuallearn.participants where withdrawn_at is null",
    assessment_attempts: "select count(*)::int n from visuallearn.assessment_attempts t join visuallearn.sessions s on s.id=t.session_id join visuallearn.participants p on p.id=s.participant_id where p.withdrawn_at is null",
    item_responses: "select (count(*)*8)::int n from visuallearn.assessment_attempts t join visuallearn.sessions s on s.id=t.session_id join visuallearn.participants p on p.id=s.participant_id where p.withdrawn_at is null and t.submitted_at is not null",
    written_responses: "select (count(free_recall)+count(scenario_response))::int n from visuallearn.assessment_attempts t join visuallearn.sessions s on s.id=t.session_id join visuallearn.participants p on p.id=s.participant_id where p.withdrawn_at is null",
    surveys: "select count(*)::int n from visuallearn.survey_submissions q join visuallearn.sessions s on s.id=q.session_id join visuallearn.participants p on p.id=s.participant_id where p.withdrawn_at is null",
    events: "select count(*)::int n from visuallearn.events e join visuallearn.sessions s on s.id=e.session_id join visuallearn.participants p on p.id=s.participant_id where p.withdrawn_at is null",
  };
  for (const table of ["participants_deidentified", "assignments", "sessions", "assessment_attempts", "item_responses", "written_responses", "free_recall_ratings", "rating_adjudications", "surveys", "followup_status", "events"]) {
    const r = await adminGet(pageOne, `export?table=${table}`);
    expect(r.status(), table).toBe(200);
    const csv = await r.text();
    const lines = csv.trimEnd().split("\r\n");
    const header = lines[0].split(",").map((h) => h.replaceAll('"', ""));
    if (expectedRows[table]) {
      const n = (await db.query(expectedRows[table])).rows[0].n;
      expect(lines.length - 1, table).toBe(n);
    }
    if (lines.length > 1) for (const col of header) expect(dictionary, `${table}.${col} documented`).toContain(`| ${col} |`);
    expect(csv, table).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    expect(csv, table).not.toMatch(/@synthetic\.invalid|SYNTHETIC LOCAL TEST|eyJ[A-Za-z0-9_-]{10,}|sb_secret|password/i);
    for (const code of codes) expect(csv, table).not.toContain(code);
    for (const id of hidden) expect(csv, table).not.toContain(id);
  }
  const codebook = await (await adminGet(pageOne, "codebook?format=json")).json();
  expect(codebook.forms.map((f: { form: string }) => f.form)).toEqual(["A", "B", "C"]);
  expect(codebook.status).toMatch(/DRAFT/);
  const audit = await db.query("select count(*)::int n from visuallearn.audit_log where action like 'export:%'");
  expect(audit.rows[0].n).toBeGreaterThanOrEqual(13);
});
async function rateAll(page: Page, kind: "free_recall" | "scenario", value: number) {
  await page.getByRole("button", { name: "Blind scoring" }).click();
  await page.getByLabel("Response type").selectOption(kind);
  await expect(page.locator(`section[data-loaded-kind="${kind}"]`)).toBeVisible();
  const none = page.getByText("No responses are waiting for your rating.");
  const save = page.getByRole("button", { name: /Save rating/ });
  for (let guard = 0; guard < 10; guard++) {
    await expect(save.or(none)).toBeVisible();
    if (await none.isVisible()) break;
    const form = page.locator(".study-form").filter({ has: save });
    const handle = await form.getByText(/^Response W-/).innerText();
    for (const group of await form.locator(".rating-grid fieldset").all())
      await group.locator('input[type="radio"]').nth(value).check();
    await save.click();
    // Wait for the next blinded response (or the empty queue) before continuing.
    await expect(
      page.locator(".study-form").filter({ has: save }).getByText(handle, { exact: true }),
    ).toHaveCount(0);
  }
  await expect(none).toBeVisible();
}
test("two blinded raters score written responses and disagreements reach adjudication", async ({ browser }) => {
  // Obtain a fresh real MFA session: the preceding three-width audit can
  // consume much of the local stack's deliberately short 90-second JWT.
  await ctxOne.clearCookies();
  await signIn(pageOne, one);
  await passMfa(pageOne, one);
  await pageOne.getByRole("button", { name: "Blind scoring" }).click();
  const shown = await pageOne.locator("section").filter({ hasText: "Blind scoring of written responses" }).innerText();
  expect(shown).not.toMatch(/\b(low|medium|high)\b|18-30|arm_key|VL-|SYNTHETIC-LOCAL-CONSENT/);
  await rateAll(pageOne, "free_recall", 2);
  await rateAll(pageOne, "scenario", 2);
  const ctxTwo = await browser.newContext();
  const pageTwo = await ctxTwo.newPage();
  await signIn(pageTwo, two);
  await passMfa(pageTwo, two);
  await rateAll(pageTwo, "free_recall", 1);
  await expect(pageTwo.getByRole("button", { name: "Record agreed scores" }).first()).toBeVisible();
  const item = pageTwo.locator(".written-step").filter({ has: pageTwo.getByRole("button", { name: "Record agreed scores" }) }).first();
  await expect(item.locator("tbody tr")).toHaveCount(2);
  for (const group of await item.locator("fieldset").all()) await group.locator('input[type="radio"]').nth(2).check();
  const pendingBefore = await pageTwo.getByRole("button", { name: "Record agreed scores" }).count();
  expect(pendingBefore).toBe(2); // both free-recall responses disagree (2 vs 1 per criterion)
  await item.getByRole("button", { name: "Record agreed scores" }).click();
  await expect(pageTwo.getByRole("button", { name: "Record agreed scores" })).toHaveCount(1);
  const ratings = await db.query("select rater_code,response_kind,total_score from visuallearn.free_recall_ratings order by rated_at");
  expect(ratings.rows.every((r) => /^R-[0-9A-F]{10}$/.test(r.rater_code))).toBe(true);
  expect(new Set(ratings.rows.map((r) => r.rater_code)).size).toBe(2);
  expect(JSON.stringify(ratings.rows)).not.toContain(one.id);
  const adj = await db.query("select count(*)::int n from visuallearn.rating_adjudications");
  expect(adj.rows[0].n).toBe(1);
  await ctxTwo.close();
});
test("tampered tokens are refused and sign-out revokes the Supabase session", async () => {
  await ctxOne.clearCookies();
  await signIn(pageOne, one);
  await passMfa(pageOne, one);
  const session = (await ctxOne.cookies()).find((c) => c.name === "visuallearn_admin")!;
  const setToken = async (value: string) => {
    await ctxOne.clearCookies({ name: "visuallearn_admin" });
    await ctxOne.addCookies([{ ...session, value }]);
  };
  await setToken(`${session.value.split(".").slice(0, 2).join(".")}.invalidsignature`);
  expect((await adminGet(pageOne, "stats")).status()).toBe(401);
  await setToken(session.value);
  expect((await adminGet(pageOne, "stats")).status()).toBe(200);
  await pageOne.goto("/admin");
  await pageOne.getByRole("button", { name: "Sign out" }).click();
  await expect(pageOne.getByRole("button", { name: "Sign in" })).toBeVisible();
  expect((await ctxOne.cookies()).some((c) => c.name.startsWith("visuallearn_admin"))).toBe(false);
  await setToken(session.value);
  expect((await adminGet(pageOne, "stats")).status(), "token replayed after sign-out").toBe(401);
  await ctxOne.clearCookies();
  // Signing in again requires the second factor again.
  await signIn(pageOne, one);
  await expect(pageOne.getByRole("heading", { name: "Two-step verification" })).toBeVisible();
  await expect(pageOne.getByRole("button", { name: "Set up authenticator" })).toHaveCount(0);
  await passMfa(pageOne, one);
});
test("an aal2 researcher session stops working once its token expires", async ({ browser }) => {
  test.setTimeout(240_000);
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await signIn(page, one);
  await passMfa(page, one);
  const cookie = (await ctx.cookies()).find((c) => c.name === "visuallearn_admin")!;
  const exp = JSON.parse(Buffer.from(cookie.value.split(".")[1], "base64url").toString()).exp as number;
  // The browser cookie never outlives the token (local stack issues 90 s tokens).
  expect(Math.abs(cookie.expires - exp)).toBeLessThanOrEqual(5);
  expect(exp - Date.now() / 1000).toBeLessThanOrEqual(3600);
  expect((await adminGet(page, "stats")).status()).toBe(200);
  await page.waitForTimeout(Math.max(0, exp * 1000 - Date.now()) + 3000);
  expect((await ctx.cookies()).some((c) => c.name === "visuallearn_admin")).toBe(false);
  await ctx.addCookies([{ ...cookie, expires: Math.floor(Date.now() / 1000) + 600 }]);
  expect((await adminGet(page, "stats")).status(), "expired token replayed").toBe(401);
  await page.goto("/admin");
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  await ctx.close();
});
