import { sameOrigin } from "@/lib/security/origin";
import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyAdminToken, adminCookie } from "@/lib/security/admin";
import { getPool } from "@/lib/db/client";
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
    const count = await getPool().query<{ request_count: number }>(
      "insert into visuallearn.request_limits(bucket,window_at,request_count) values('admin-login',now(),1) on conflict(bucket) do update set request_count=case when visuallearn.request_limits.window_at<now()-interval '1 minute' then 1 else visuallearn.request_limits.request_count+1 end,window_at=case when visuallearn.request_limits.window_at<now()-interval '1 minute' then now() else visuallearn.request_limits.window_at end returning request_count",
    );
    if (count.rows[0].request_count > 10)
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
    if (new URL(process.env.SUPABASE_URL).protocol !== "https:")
      throw new Error("HTTPS required");
    const auth = await fetch(
      `${process.env.SUPABASE_URL.replace(/\/$/, "")}/auth/v1/token?grant_type=password`,
      {
        method: "POST",
        headers: {
          apikey: process.env.SUPABASE_ANON_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(8000),
      },
    );
    const data = await auth.json();
    if (!auth.ok || typeof data.access_token !== "string")
      throw new Error("Invalid sign-in");
    await verifyAdminToken(data.access_token);
    const response = NextResponse.json(
      { signedIn: true },
      { headers: { "Cache-Control": "no-store" } },
    );
    response.cookies.set(adminCookie, data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: Math.min(data.expires_in || 3600, 3600),
    });
    return response;
  } catch {
    return NextResponse.json(
      { error: "Unable to sign in with an authorized researcher account." },
      { status: 401 },
    );
  }
}
