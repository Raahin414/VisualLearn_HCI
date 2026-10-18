import "server-only";
import { createHash } from "node:crypto";
import { cookies } from "next/headers";
export const adminCookie = "visuallearn_admin";
// Short-lived first-factor (aal1) token used only to enroll or verify TOTP.
export const adminMfaCookie = "visuallearn_admin_mfa";
export const ADMIN_SESSION_MAX_SECONDS = 3600;
export const MFA_PENDING_SECONDS = 300;
export class AdminAuthError extends Error {}
/** MFA is required unless explicitly disabled for a non-production rehearsal. */
export function mfaRequired() {
  return (
    process.env.NODE_ENV === "production" ||
    process.env.ADMIN_REQUIRE_MFA !== "false"
  );
}
export function authBase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key)
    throw new AdminAuthError("Administrator authentication is not configured.");
  const parsed = new URL(url);
  // Plain HTTP only for a local Supabase stack during development tests.
  const loopback =
    parsed.hostname === "127.0.0.1" || parsed.hostname === "localhost";
  if (
    parsed.protocol !== "https:" &&
    !(loopback && process.env.NODE_ENV !== "production")
  )
    throw new AdminAuthError("HTTPS Supabase authentication is required.");
  return { url: url.replace(/\/$/, ""), key };
}
export async function supabaseAuth(
  path: string,
  init: { method?: string; token?: string; body?: unknown } = {},
) {
  const { url, key } = authBase();
  const response = await fetch(`${url}/auth/v1/${path}`, {
    method: init.method ?? (init.body === undefined ? "GET" : "POST"),
    headers: {
      apikey: key,
      ...(init.token ? { Authorization: `Bearer ${init.token}` } : {}),
      ...(init.body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(8000),
  });
  const text = await response.text();
  let data: Record<string, unknown> = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {}
  return { ok: response.ok, status: response.status, data };
}
export function allowlist() {
  return (process.env.ADMIN_ALLOWLIST || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}
/** Claims of a token that Supabase has just accepted at /auth/v1/user. */
function claims(token: string) {
  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1] ?? "", "base64url").toString(),
    );
    return payload && typeof payload === "object"
      ? (payload as { aal?: string; exp?: number; sub?: string })
      : {};
  } catch {
    return {};
  }
}
export type AdminUser = {
  id: string;
  aal: string;
  verifiedTotp: { id: string }[];
};
/**
 * Supabase validates signature, expiry and the live session; the app then
 * enforces the UUID allowlist and (unless `requireAal2` is false) MFA level.
 */
export async function verifyAdminToken(
  token: string,
  { requireAal2 = mfaRequired() } = {},
): Promise<AdminUser> {
  if (!allowlist().length)
    throw new AdminAuthError("Administrator authentication is not configured.");
  const user = await supabaseAuth("user", { token });
  if (!user.ok) throw new AdminAuthError("Administrator authentication failed.");
  const id = user.data.id;
  if (typeof id !== "string" || !allowlist().includes(id))
    throw new AdminAuthError("This account is not authorized.");
  const c = claims(token);
  if (c.sub !== id || !c.exp || c.exp * 1000 <= Date.now())
    throw new AdminAuthError("Administrator session expired.");
  const aal = c.aal ?? "aal1";
  if (requireAal2 && aal !== "aal2")
    throw new AdminAuthError("Multi-factor verification is required.");
  const factors = Array.isArray(user.data.factors) ? user.data.factors : [];
  return {
    id,
    aal,
    verifiedTotp: factors.filter(
      (f: { factor_type?: string; status?: string }) =>
        f.factor_type === "totp" && f.status === "verified",
    ),
  };
}
export async function requireAdmin() {
  const token = (await cookies()).get(adminCookie)?.value;
  if (!token) throw new AdminAuthError("Administrator sign-in is required.");
  return (await verifyAdminToken(token)).id;
}
/** Pseudonymous, stable rater/actor code; never the account UUID or email. */
export function actorCode(adminId: string) {
  return `R-${createHash("sha256").update(`visuallearn-rater:${adminId}`).digest("hex").slice(0, 10).toUpperCase()}`;
}
export const cookieOptions = (maxAge: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
  maxAge,
});
