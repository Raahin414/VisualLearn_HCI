import { sameOrigin } from "@/lib/security/origin";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  adminCookie,
  adminMfaCookie,
  ADMIN_SESSION_MAX_SECONDS,
  cookieOptions,
  mfaRequired,
  MFA_PENDING_SECONDS,
  supabaseAuth,
  verifyAdminToken,
} from "@/lib/security/admin";
import { adminRateLimited } from "@/lib/security/admin-limit";
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return NextResponse.json(
      { error: "Same-origin request required." },
      { status: 403 },
    );
  if (
    !process.env.SUPABASE_URL ||
    !process.env.SUPABASE_ANON_KEY ||
    !process.env.DATABASE_URL
  )
    return NextResponse.json(
      { error: "Administrator authentication is not configured." },
      { status: 503 },
    );
  try {
    if (await adminRateLimited("admin-login"))
      return NextResponse.json(
        { error: "Please wait a minute before trying again." },
        { status: 429 },
      );
    if (Number(request.headers.get("content-length") || 0) > 4096)
      return new Response(null, { status: 413 });
    const body = await request.text();
    if (body.length > 4096) return new Response(null, { status: 413 });
    const { email, password } = z
      .object({ email: z.email(), password: z.string().min(1).max(1000) })
      .strict()
      .parse(JSON.parse(body));
    const auth = await supabaseAuth("token?grant_type=password", {
      body: { email, password },
    });
    const token = auth.data.access_token;
    if (!auth.ok || typeof token !== "string") throw new Error("Invalid sign-in");
    // First factor accepted; the allowlist is enforced before any MFA step.
    const user = await verifyAdminToken(token, { requireAal2: false });
    const expires = Math.min(
      Number(auth.data.expires_in) || ADMIN_SESSION_MAX_SECONDS,
      ADMIN_SESSION_MAX_SECONDS,
    );
    const headers = { "Cache-Control": "no-store" };
    if (!mfaRequired()) {
      const response = NextResponse.json({ signedIn: true }, { headers });
      response.cookies.set(adminCookie, token, cookieOptions(expires));
      return response;
    }
    const response = NextResponse.json(
      { mfa: user.verifiedTotp.length ? "verify" : "enroll" },
      { headers },
    );
    response.cookies.set(
      adminMfaCookie,
      token,
      cookieOptions(Math.min(expires, MFA_PENDING_SECONDS)),
    );
    response.cookies.delete(adminCookie);
    return response;
  } catch {
    return NextResponse.json(
      { error: "Unable to sign in with an authorized researcher account." },
      { status: 401 },
    );
  }
}
