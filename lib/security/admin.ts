import "server-only";
import { cookies } from "next/headers";
export const adminCookie = "visuallearn_admin";
export async function verifyAdminToken(token: string) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  const allowed = (process.env.ADMIN_ALLOWLIST || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
  if (!url || !key || !allowed.length)
    throw new Error("Administrator authentication is not configured.");
  if (new URL(url).protocol !== "https:")
    throw new Error("HTTPS Supabase authentication is required.");
  const response = await fetch(`${url.replace(/\/$/, "")}/auth/v1/user`, {
    headers: { apikey: key, Authorization: `Bearer ${token}` },
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error("Administrator authentication failed.");
  const user = await response.json();
  if (typeof user.id !== "string" || !allowed.includes(user.id))
    throw new Error("This account is not authorized.");
  return user.id as string;
}
export async function requireAdmin() {
  const token = (await cookies()).get(adminCookie)?.value;
  if (!token) throw new Error("Administrator sign-in is required.");
  return verifyAdminToken(token);
}
