import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import pg from "pg";
import { expect, type BrowserContext, type Page } from "@playwright/test";
import { answerAll, completeWritten } from "../e2e/helpers";
export { answerAll, completeWritten };
export const BASE = "http://127.0.0.1:3100";
export const harness = JSON.parse(
  readFileSync(path.resolve(process.cwd(), ".local/connected.json"), "utf8"),
) as {
  ownerUrl: string;
  authUrl: string;
  researchers: { id: string; email: string; password: string }[];
  outsider: { email: string; password: string };
  jwtSecret: string;
};
if (!/@127\.0\.0\.1:/.test(harness.ownerUrl))
  throw new Error("Connected tests only run against the local Supabase stack.");
export const db = new pg.Pool({ connectionString: harness.ownerUrl, max: 2 });
/** Test-only read of the signed cookie payload; it cannot be forged without the secret. */
export async function sessionId(context: BrowserContext) {
  const cookie = (await context.cookies()).find((c) => c.name === "visuallearn_session");
  if (!cookie) return null;
  return JSON.parse(Buffer.from(cookie.value.split(".")[0], "base64url").toString()).id as string;
}
/** Same-origin JSON call with the context's cookies (like the app's own fetch). */
export async function api(page: Page, action: string, body?: unknown) {
  const r =
    body === undefined
      ? await page.request.get(`${BASE}/api/study/${action}`)
      : await page.request.post(`${BASE}/api/study/${action}`, {
          data: body,
          headers: { Origin: BASE },
        });
  return { status: r.status(), body: await r.json() };
}
export async function enroll(page: Page) {
  await page.goto("/study/enroll");
  await expect(page.getByText(/SYNTHETIC LOCAL TEST/)).toBeVisible();
  await page.getByLabel("Age band").selectOption("18-30");
  await page.getByLabel("How comfortable are you learning in English?").selectOption("4");
  await page.getByLabel("How familiar are you with the water cycle?").selectOption("2");
  for (const box of await page.locator('input[type="checkbox"]').all()) await box.check();
  await page.getByRole("button", { name: "Consent and begin baseline assessment" }).click();
  await expect(page.getByRole("heading", { name: "Before we begin." })).toBeVisible();
}
export async function finishLesson(page: Page) {
  for (;;) {
    const label = await page.getByText(/^CHAPTER \d OF 5$/).innerText();
    const n = Number(label.match(/\d/)![0]);
    if (n === 5) break;
    await page.getByRole("button", { name: "Next chapter" }).click();
    await expect(page.getByText(`CHAPTER ${n + 1} OF 5`, { exact: true })).toBeVisible();
  }
  await page.getByRole("button", { name: "Complete lesson" }).click();
  await expect(page.getByText("Part 1 of 2 · written answers")).toBeVisible();
}
export async function fillF3(page: Page) {
  for (const name of ["clarity", "overload", "support", "distraction", "pacing", "audio", "color", "acceptability", "mentalEffort"])
    await page.locator(`input[name="${name}"]`).nth(2).check();
  await page.locator('input[name="motion"][value="not_applicable"]').check();
}
/** Shift a SYNTHETIC session's server timestamps back, as if time had passed. */
export async function shiftFollowup(session: string, minutes: number) {
  const shift = `${minutes} minutes`;
  await db.query(
    "update visuallearn.sessions set lesson_completed_at=lesson_completed_at-$2::interval where id=$1",
    [session, shift],
  );
  await db.query(
    "update visuallearn.scheduled_followups set due_at=due_at-$2::interval,deadline_at=deadline_at-$2::interval where session_id=$1",
    [session, shift],
  );
}
const base32 = (s: string) => {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const c of s.replace(/=+$/, "").toUpperCase())
    bits += alphabet.indexOf(c).toString(2).padStart(5, "0");
  return Buffer.from(bits.match(/.{8}/g)!.map((b) => parseInt(b, 2)));
};
/** RFC 6238 TOTP (SHA-1, 30 s, 6 digits), as an authenticator app computes it. */
export function totp(secret: string, at = Date.now()) {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(at / 30_000)));
  const h = createHmac("sha1", base32(secret)).update(counter).digest();
  const o = h[h.length - 1] & 15;
  return String((h.readUInt32BE(o) & 0x7fffffff) % 1_000_000).padStart(6, "0");
}
const used = new Set<string>();
/** A code not used before (waits for the next period if needed). */
export async function freshTotp(secret: string) {
  for (;;) {
    const code = totp(secret);
    const key = `${secret}:${code}`;
    if (!used.has(key)) {
      used.add(key);
      return code;
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
}
