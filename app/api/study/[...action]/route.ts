import { sameOrigin } from "@/lib/security/origin";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getPool, transaction } from "@/lib/db/client";
import { StudyService, StudyError, type SQL } from "@/lib/study/service";
import { hashToken, signSession, verifySession } from "@/lib/security/tokens";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const cookieName = "visuallearn_session";
type Context = { params: Promise<{ action: string[] }> };
const json = (data: unknown, status = 200) =>
  NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
async function boundedBody(request: Request) {
  const reader = request.body?.getReader();
  if (!reader)
    throw new StudyError("EMPTY_BODY", "A JSON request is required.");
  let bytes = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.length;
    if (bytes > 65536) {
      await reader.cancel();
      throw new StudyError("TOO_LARGE", "The request exceeds 64 KB.", 413);
    }
    chunks.push(value);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
}
async function handle(request: NextRequest, ctx: Context) {
  try {
    const action = (await ctx.params).action.join("/");
    const isPost = request.method === "POST";
    const allowedGet = [
      "consent",
      "session",
      "lesson",
      "assessment/pre",
      "assessment/immediate",
      "assessment/plus_60m",
    ];
    const allowedPost = [
      "enroll",
      "recover",
      "progress",
      "complete",
      "return-token",
      "events",
      "withdraw",
      "assessment/pre",
      "assessment/immediate",
      "assessment/plus_60m",
      "survey/F3",
      "survey/F5",
    ];
    if (!(isPost ? allowedPost : allowedGet).includes(action))
      return json(
        { error: { code: "NOT_FOUND", message: "Unknown study operation." } },
        404,
      );
    if (isPost && !sameOrigin(request))
      throw new StudyError("ORIGIN", "Same-origin request required.", 403);
    if (
      !process.env.DATABASE_URL ||
      !process.env.SESSION_SECRET ||
      Buffer.byteLength(process.env.SESSION_SECRET) < 32
    )
      throw new StudyError(
        "NOT_CONFIGURED",
        "The research infrastructure is not configured.",
        503,
      );
    if (action === "enroll" && process.env.STUDY_ENABLED !== "true")
      throw new StudyError(
        "STUDY_CLOSED",
        "Research enrollment is closed.",
        503,
      );
    const cookie = request.cookies.get(cookieName)?.value;
    const id = cookie
      ? verifySession(cookie, process.env.SESSION_SECRET)
      : null;
    const publicOperation = ["enroll", "recover", "consent"].includes(action);
    if (!id && !publicOperation)
      throw new StudyError(
        "UNAUTHORIZED",
        "A valid participant session is required.",
        401,
      );
    // Separate committed limiter transaction, so failed operations still count.
    const bucket = hashToken(`${id || "public"}:${isPost ? "write" : "read"}`);
    const limit = await getPool().query<{ request_count: number }>(
      "insert into visuallearn.request_limits(bucket,window_at,request_count) values($1,now(),1) on conflict(bucket) do update set request_count=case when visuallearn.request_limits.window_at<now()-interval '1 minute' then 1 else visuallearn.request_limits.request_count+1 end,window_at=case when visuallearn.request_limits.window_at<now()-interval '1 minute' then now() else visuallearn.request_limits.window_at end returning request_count",
      [bucket],
    );
    if (limit.rows[0].request_count > (id ? 180 : 60))
      throw new StudyError(
        "RATE_LIMIT",
        "Please wait a minute before trying again.",
        429,
      );
    const input = isPost ? await boundedBody(request) : null;
    let sessionToSet: string | undefined;
    const data = await transaction(async (client) => {
      const service = new StudyService(client as unknown as SQL);
      if (action === "consent") {
        const e = await service.gate();
        return {
          consentVersion: e.consent_version,
          consentText: e.consent_text,
          studyContact: e.study_contact,
        };
      }
      if (action === "enroll") {
        if (id) {
          await service.session(id);
          return { alreadyEnrolled: true };
        }
        const result = await service.enroll(
          input,
          request.headers.get("Idempotency-Key") || "",
        );
        sessionToSet = result.sessionId;
        return { enrolled: true };
      }
      if (action === "recover") {
        const { token } = z.object({ token: z.string() }).strict().parse(input);
        const result = await service.recover(token);
        sessionToSet = result.sessionId;
        return { recovered: true };
      }
      const sessionId = id!;
      if (action === "session") return service.snapshot(sessionId);
      if (action === "lesson") return service.getLesson(sessionId);
      if (action === "progress") return service.progress(sessionId, input);
      if (action === "complete") return service.completeLesson(sessionId);
      if (action === "return-token") return service.issueReturnToken(sessionId);
      if (action === "events") return service.ingestEvents(sessionId, input);
      if (action === "withdraw") return service.withdraw(sessionId);
      if (action.startsWith("assessment/")) {
        const stage = z
          .enum(["pre", "immediate", "plus_60m"])
          .parse(action.split("/")[1]);
        return isPost
          ? service.submitAssessment(sessionId, stage, input)
          : service.assessment(sessionId, stage);
      }
      const form = z.enum(["F3", "F5"]).parse(action.split("/")[1]);
      return service.submitSurvey(sessionId, form, input);
    });
    const response = json(data);
    if (sessionToSet)
      response.cookies.set(
        cookieName,
        signSession(sessionToSet, process.env.SESSION_SECRET),
        {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          path: "/",
          maxAge: 8 * 24 * 60 * 60,
        },
      );
    if (action === "withdraw") response.cookies.delete(cookieName);
    return response;
  } catch (error) {
    if (error instanceof StudyError)
      return json(
        { error: { code: error.code, message: error.message } },
        error.status,
      );
    if (error instanceof z.ZodError || error instanceof SyntaxError)
      return json(
        {
          error: {
            code: "INVALID_INPUT",
            message: "Please check the submitted fields.",
          },
        },
        400,
      );
    console.error("Study operation failed without recording request content.");
    return json(
      {
        error: {
          code: "INTERNAL",
          message:
            "The study request could not be completed. Your saved progress is preserved.",
        },
      },
      500,
    );
  }
}
export const GET = handle;
export const POST = handle;
