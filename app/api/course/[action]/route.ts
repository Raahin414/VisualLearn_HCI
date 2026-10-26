import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { transaction } from "@/lib/db/client";
import { ZodError } from "zod";
import { sameOrigin } from "@/lib/security/origin";
import { adminRateLimited } from "@/lib/security/admin-limit";
import { startCourse, currentAttempt, submitCourse, withdrawCourse, CourseClosedError } from "@/lib/courses/recording.server";
import type { SQL } from "@/lib/study/service";

export const dynamic = "force-dynamic";
const cookieName = "vl_course_attempt";
const headers = { "Cache-Control": "no-store" };
type Ctx = { params: Promise<{ action: string }> };
export async function GET(_request: NextRequest, context: Ctx) {
  if ((await context.params).action !== "session") return NextResponse.json({ error: "Unknown action." }, { status: 404 });
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return NextResponse.json({ error: "No course session." }, { status: 401, headers });
  try {
    const attempt = await transaction((client) => currentAttempt(client as unknown as SQL, token));
    return NextResponse.json(attempt, { headers });
  } catch { return NextResponse.json({ error: "Course session unavailable." }, { status: 401, headers }); }
}
export async function POST(request: NextRequest, context: Ctx) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid origin." }, { status: 403, headers });
  if (Number(request.headers.get("content-length") || 0) > 4096) return NextResponse.json({ error: "Request too large." }, { status: 413, headers });
  const { action } = await context.params;
  if (action === "start" && process.env.COURSE_RECORDING_ENABLED !== "true")
    return NextResponse.json({ error: "Course recording is closed pending research approval." }, { status: 503, headers });
  if (!["start", "submit", "withdraw"].includes(action))
    return NextResponse.json({ error: "Unknown action." }, { status: 404, headers });
  try {
    if (await adminRateLimited(`course:${action}`, action === "start" ? 60 : 180))
      return NextResponse.json({ error: "Please wait a minute before trying again." }, { status: 429, headers });
    const text = await request.text();
    if (text.length > 4096) return NextResponse.json({ error: "Request too large." }, { status: 413, headers });
    const body = JSON.parse(text);
    if (action === "start") {
      const result = await transaction((client) => startCourse(client as unknown as SQL, body));
      const response = NextResponse.json({ slug: result.slug }, { headers });
      response.cookies.set(cookieName, result.token, { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 });
      return response;
    }
    if (action === "submit") {
      const token = (await cookies()).get(cookieName)?.value;
      if (!token) return NextResponse.json({ error: "No course session." }, { status: 401, headers });
      const result = await transaction((client) => submitCourse(client as unknown as SQL, token, body));
      return NextResponse.json(result, { headers });
    }
    if (action === "withdraw") {
      const token = (await cookies()).get(cookieName)?.value;
      if (!token) return NextResponse.json({ error: "No course session." }, { status: 401, headers });
      await transaction((client) => withdrawCourse(client as unknown as SQL, token));
      const response = NextResponse.json({ withdrawn: true }, { headers });
      response.cookies.delete(cookieName);
      return response;
    }
    return NextResponse.json({ error: "Unknown action." }, { status: 404, headers });
  } catch (error) {
    const known = error instanceof ZodError || error instanceof CourseClosedError;
    return NextResponse.json({ error: error instanceof CourseClosedError ? error.message : known ? "Please check your course details and try again." : "Unable to save the course. Please try again." }, { status: error instanceof CourseClosedError ? 503 : known ? 400 : 500, headers });
  }
}
