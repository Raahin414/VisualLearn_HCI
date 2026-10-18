import { sameOrigin } from "@/lib/security/origin";
import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAuth } from "@/lib/security/admin";
import { adminRateLimited } from "@/lib/security/admin-limit";
// Sends a Supabase password-recovery email that returns to /admin/accept.
// The response never reveals whether an account exists.
export async function POST(request: Request) {
  const headers = { "Cache-Control": "no-store" };
  if (!sameOrigin(request))
    return NextResponse.json({ error: "Same-origin request required." }, { status: 403, headers });
  const base =
    process.env.APP_BASE_URL ||
    (process.env.NODE_ENV !== "production" ? "http://127.0.0.1:3000" : null);
  if (!base || !process.env.SUPABASE_URL || !process.env.DATABASE_URL)
    return NextResponse.json(
      { error: "Administrator authentication is not configured." },
      { status: 503, headers },
    );
  try {
    if (await adminRateLimited("admin-recover", 5))
      return NextResponse.json(
        { error: "Please wait a minute before trying again." },
        { status: 429, headers },
      );
    const text = await request.text();
    if (text.length > 1024) return new Response(null, { status: 413 });
    const { email } = z.object({ email: z.email() }).strict().parse(JSON.parse(text));
    const redirect = new URL("/admin/accept", base).toString();
    await supabaseAuth(`recover?redirect_to=${encodeURIComponent(redirect)}`, {
      body: { email },
    }).catch(() => undefined);
    return NextResponse.json({ sent: true }, { headers });
  } catch {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400, headers });
  }
}
