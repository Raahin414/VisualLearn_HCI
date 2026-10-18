import { sameOrigin } from "@/lib/security/origin";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  adminCookie,
  adminMfaCookie,
  ADMIN_SESSION_MAX_SECONDS,
  cookieOptions,
  supabaseAuth,
  verifyAdminToken,
} from "@/lib/security/admin";
import { adminRateLimited } from "@/lib/security/admin-limit";
const input = z.discriminatedUnion("action", [
  z.object({ action: z.literal("enroll") }).strict(),
  z
    .object({
      action: z.literal("verify"),
      code: z.string().regex(/^\d{6}$/),
      factorId: z.uuid().optional(),
    })
    .strict(),
]);
const fail = (error: string, status: number) =>
  NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
// TOTP enrollment and verification after a successful allowlisted password
// sign-in. Only an aal2 token (after verification) becomes the admin session.
export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return fail("Same-origin request required.", 403);
  const pending = request.cookies.get(adminMfaCookie)?.value;
  if (!pending) return fail("Sign in with your password first.", 401);
  try {
    if (await adminRateLimited("admin-mfa"))
      return fail("Please wait a minute before trying again.", 429);
    const text = await request.text();
    if (text.length > 1024) return new Response(null, { status: 413 });
    const body = input.parse(JSON.parse(text));
    const user = await verifyAdminToken(pending, { requireAal2: false });
    const me = await supabaseAuth("user", { token: pending });
    const factors = (Array.isArray(me.data.factors) ? me.data.factors : []) as {
      id: string;
      factor_type: string;
      status: string;
    }[];
    if (body.action === "enroll") {
      if (user.verifiedTotp.length)
        return fail("An authenticator is already enrolled. Enter its code.", 409);
      // Abandoned enrollments are removed so a fresh QR code can be issued.
      for (const f of factors.filter((f) => f.status !== "verified"))
        await supabaseAuth(`factors/${f.id}`, { method: "DELETE", token: pending });
      const enrolled = await supabaseAuth("factors", {
        token: pending,
        body: {
          factor_type: "totp",
          issuer: "VisualLearn research",
          friendly_name: `VisualLearn ${new Date().toISOString().slice(0, 16)}`,
        },
      });
      const totp = enrolled.data.totp as { qr_code?: string; secret?: string } | undefined;
      if (!enrolled.ok || typeof enrolled.data.id !== "string" || !totp?.secret)
        return fail("Authenticator enrollment is unavailable.", 502);
      return NextResponse.json(
        { factorId: enrolled.data.id, qrCode: totp.qr_code, secret: totp.secret },
        { headers: { "Cache-Control": "no-store" } },
      );
    }
    const factorId = body.factorId ?? user.verifiedTotp[0]?.id;
    if (!factorId || !factors.some((f) => f.id === factorId && f.factor_type === "totp"))
      return fail("Enroll an authenticator first.", 409);
    const challenge = await supabaseAuth(`factors/${factorId}/challenge`, {
      token: pending,
      body: {},
    });
    if (!challenge.ok || typeof challenge.data.id !== "string")
      return fail("The code could not be checked. Try again.", 401);
    const verified = await supabaseAuth(`factors/${factorId}/verify`, {
      token: pending,
      body: { challenge_id: challenge.data.id, code: body.code },
    });
    const token = verified.data.access_token;
    if (!verified.ok || typeof token !== "string")
      return fail("That code was not accepted.", 401);
    await verifyAdminToken(token, { requireAal2: true });
    const response = NextResponse.json(
      { signedIn: true },
      { headers: { "Cache-Control": "no-store" } },
    );
    response.cookies.set(
      adminCookie,
      token,
      cookieOptions(
        Math.min(
          Number(verified.data.expires_in) || ADMIN_SESSION_MAX_SECONDS,
          ADMIN_SESSION_MAX_SECONDS,
        ),
      ),
    );
    response.cookies.delete(adminMfaCookie);
    return response;
  } catch {
    return fail("Multi-factor verification failed. Sign in again.", 401);
  }
}
