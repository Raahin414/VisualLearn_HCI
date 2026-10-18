import { sameOrigin } from "@/lib/security/origin";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  adminCookie,
  adminMfaCookie,
  ADMIN_SESSION_MAX_SECONDS,
  cookieOptions,
  MFA_PENDING_SECONDS,
  supabaseAuth,
  verifyAdminToken,
} from "@/lib/security/admin";
import { adminRateLimited } from "@/lib/security/admin-limit";
import { passwordProblem } from "@/lib/security/password-policy";
const input = z
  .object({
    accessToken: z.string().min(20).max(4096),
    password: z.string().max(128),
    code: z
      .string()
      .regex(/^\d{6}$/)
      .optional(),
  })
  .strict();
const fail = (error: string, status: number, extra: object = {}) =>
  NextResponse.json({ error, ...extra }, { status, headers: { "Cache-Control": "no-store" } });
// Completes a Supabase invite or password-recovery link. The one-time token
// from the link fragment is posted once and never stored by the browser.
// Researchers who already use an authenticator must confirm a code first:
// Supabase refuses password changes from aal1 sessions once MFA is enabled.
export async function POST(request: Request) {
  if (!sameOrigin(request)) return fail("Same-origin request required.", 403);
  try {
    if (await adminRateLimited("admin-password"))
      return fail("Please wait a minute before trying again.", 429);
    const text = await request.text();
    if (text.length > 8192) return new Response(null, { status: 413 });
    const body = input.parse(JSON.parse(text));
    const problem = passwordProblem(body.password);
    if (problem) return fail(problem, 400);
    // Allowlist is enforced before anything changes.
    const user = await verifyAdminToken(body.accessToken, { requireAal2: false });
    let token = body.accessToken;
    let expiresIn = MFA_PENDING_SECONDS;
    const factor = user.verifiedTotp[0];
    if (factor) {
      if (!body.code)
        return fail("Enter the code from your authenticator app.", 409, { needCode: true });
      const challenge = await supabaseAuth(`factors/${factor.id}/challenge`, { token, body: {} });
      const verified =
        challenge.ok && typeof challenge.data.id === "string"
          ? await supabaseAuth(`factors/${factor.id}/verify`, {
              token,
              body: { challenge_id: challenge.data.id, code: body.code },
            })
          : null;
      if (!verified?.ok || typeof verified.data.access_token !== "string")
        return fail("That code was not accepted.", 401, { needCode: true });
      token = verified.data.access_token;
      expiresIn = Number(verified.data.expires_in) || ADMIN_SESSION_MAX_SECONDS;
    }
    const updated = await supabaseAuth("user", {
      method: "PUT",
      token,
      body: { password: body.password },
    });
    if (!updated.ok)
      return fail(
        updated.data.error_code === "weak_password" || updated.data.error_code === "same_password"
          ? "Choose a different, stronger password."
          : "The password could not be set. Ask for a new link.",
        400,
      );
    const response = NextResponse.json(
      { passwordSet: true, signedIn: !!factor },
      { headers: { "Cache-Control": "no-store" } },
    );
    if (factor) {
      // Already verified with the second factor: this is a full session.
      await verifyAdminToken(token, { requireAal2: true });
      response.cookies.set(adminCookie, token, cookieOptions(Math.min(expiresIn, ADMIN_SESSION_MAX_SECONDS)));
      response.cookies.delete(adminMfaCookie);
    } else {
      // New researcher: continue to authenticator enrollment on /admin.
      response.cookies.set(adminMfaCookie, token, cookieOptions(MFA_PENDING_SECONDS));
      response.cookies.delete(adminCookie);
    }
    return response;
  } catch {
    return fail("This link is invalid, expired or not for an authorized researcher.", 401);
  }
}
