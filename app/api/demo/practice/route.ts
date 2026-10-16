import { NextResponse } from "next/server";
import { scoreAnswers } from "@/lib/assessments/questions.server";
import { sameOrigin } from "@/lib/security/origin";
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return NextResponse.json(
      { error: { code: "ORIGIN", message: "Same-origin request required." } },
      { status: 403 },
    );
  if (Number(request.headers.get("content-length") || 0) > 4096)
    return new Response(null, { status: 413 });
  try {
    const text = await request.text();
    if (text.length > 4096) return new Response(null, { status: 413 });
    const result = scoreAnswers("P", JSON.parse(text));
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_ANSWERS",
          message: "Please answer all eight questions.",
        },
      },
      { status: 400 },
    );
  }
}
