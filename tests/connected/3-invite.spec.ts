// Researcher invitation and password recovery against local Supabase Auth,
// using real invite/recovery links (admin generate_link), no mocks.
import { test, expect, type Page } from "@playwright/test";
import { BASE, freshTotp, harness, passMfa, secrets, signIn } from "./support";
test.describe.configure({ mode: "serial" });
const { invited, outsider, root } = harness.invites;
let password = "Invited-Researcher-2026";
async function setPassword(page: Page, value: string, repeat = value) {
  await page.getByLabel("New password").fill(value);
  await page.getByLabel("Repeat the password").fill(repeat);
  await page.getByRole("button", { name: /Set password and continue|Save new password/ }).click();
}
async function passwordGrant(email: string, pw: string) {
  const r = await fetch(`${harness.authUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: harness.anonKey, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: pw }),
  });
  return r.status;
}
test("an allowlisted invitee sets a password, must enroll MFA, then can sign in normally", async ({ page }) => {
  await page.goto(invited.link);
  await expect(page.getByRole("heading", { name: "Set up your researcher account" })).toBeVisible();
  expect(page.url()).toBe(`${BASE}/admin/accept`); // one-time token removed from the address bar
  await setPassword(page, "short");
  await expect(page.locator(".form-error")).toContainText("at least 12");
  await setPassword(page, "alllowercase-and-long1");
  await expect(page.locator(".form-error")).toContainText("uppercase");
  await setPassword(page, password, `${password}x`);
  await expect(page.locator(".form-error")).toContainText("do not match");
  await setPassword(page, password);
  // Password alone is not enough: authenticator enrollment comes next.
  await expect(page.getByRole("heading", { name: "Two-step verification" })).toBeVisible();
  expect((await page.request.get(`${BASE}/api/admin/stats`)).status()).toBe(401);
  await passMfa(page, invited);
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  await signIn(page, { email: invited.email, password });
  await expect(page.getByRole("heading", { name: "Two-step verification" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Set up authenticator" })).toHaveCount(0);
  await passMfa(page, invited);
});
test("an invitation link works only once", async ({ page }) => {
  await page.goto(invited.link);
  await expect(page.getByRole("heading", { name: "Link unavailable" })).toBeVisible();
  await expect(page.locator(".form-error")).toContainText("already been used or has expired");
});
test("an invitee outside the allowlist cannot set a password", async ({ page }) => {
  await page.goto(outsider.link);
  await setPassword(page, "Outsider-Password-2026");
  await expect(page.locator(".form-error")).toContainText("not for an authorized researcher");
  expect(await passwordGrant(outsider.email, "Outsider-Password-2026")).toBe(400);
  expect((await page.context().cookies()).some((c) => c.name.startsWith("visuallearn_admin"))).toBe(false);
});
test("links that land on the site root are forwarded to the accept page", async ({ page }) => {
  await page.goto(root.link);
  await expect(page.getByRole("heading", { name: "Set up your researcher account" })).toBeVisible();
  expect(page.url()).toBe(`${BASE}/admin/accept`);
  await setPassword(page, "Root-Forwarded-2026");
  await expect(page.getByRole("heading", { name: "Two-step verification" })).toBeVisible();
});
test("password reset requests never reveal whether an account exists", async ({ page }) => {
  for (const email of [invited.email, "nobody-here@synthetic.invalid"]) {
    await page.goto("/admin");
    await page.getByRole("button", { name: "Forgot password?" }).click();
    await page.getByLabel("Email").fill(email);
    await page.getByRole("button", { name: "Send reset link" }).click();
    await expect(page.getByRole("status")).toContainText("If that address belongs to a researcher account");
  }
});
test("recovery for an MFA researcher requires the authenticator code before the password changes", async ({ page }) => {
  const r = await fetch(`${harness.authUrl}/auth/v1/admin/generate_link`, {
    method: "POST",
    headers: { apikey: harness.serviceKey, Authorization: `Bearer ${harness.serviceKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ type: "recovery", email: invited.email, redirect_to: `${BASE}/admin/accept` }),
  });
  const { action_link } = await r.json();
  await page.goto(action_link);
  await expect(page.getByRole("heading", { name: "Choose a new password" })).toBeVisible();
  const next = "Recovered-Password-2026";
  await setPassword(page, next);
  await expect(page.locator(".form-error")).toContainText("authenticator");
  expect(await passwordGrant(invited.email, next)).toBe(400); // unchanged so far
  await page.getByLabel("Six-digit code from your authenticator").fill("000000");
  await page.getByRole("button", { name: "Save new password" }).click();
  await expect(page.locator(".form-error")).toContainText("not accepted");
  await page.getByLabel("Six-digit code from your authenticator").fill(await freshTotp(secrets[invited.email]));
  await page.getByRole("button", { name: "Save new password" }).click();
  // Code verified: straight into the workspace with a full (aal2) session.
  await expect(page.getByRole("heading", { name: "Allocation by age band and condition" })).toBeVisible();
  expect(await passwordGrant(invited.email, password)).toBe(400);
  expect(await passwordGrant(invited.email, next)).toBe(200);
  password = next;
});
