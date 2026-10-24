import { sameOrigin } from "@/lib/security/origin";
import { NextRequest, NextResponse } from "next/server";
import {
  actorCode,
  adminCookie,
  adminMfaCookie,
  requireAdmin,
  supabaseAuth,
} from "@/lib/security/admin";
import { hashToken } from "@/lib/security/tokens";
import { transaction } from "@/lib/db/client";
import {
  exportQueries,
  exportRows,
  toCsv,
  studyStats,
  type ExportName,
} from "@/lib/admin/exports";
import { codebook, dataDictionaryMarkdown } from "@/lib/admin/codebook";
import {
  adjudicationQueue,
  nextForRater,
  submitAdjudication,
  submitRating,
} from "@/lib/admin/rating";
import type { SQL } from "@/lib/study/service";
export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ operation: string }> };
const noStore = { "Cache-Control": "no-store" };
const unauthorized = () =>
  NextResponse.json(
    {
      error: { code: "UNAUTHORIZED", message: "Researcher sign-in required." },
    },
    { status: 401, headers: noStore },
  );
const audit = (db: SQL, actor: string, action: string) =>
  db.query(
    "insert into visuallearn.audit_log(actor_hash,action) values($1,$2)",
    [hashToken(actor), action],
  );
export async function GET(request: NextRequest, ctx: Ctx) {
  let actor: string;
  try {
    actor = await requireAdmin();
  } catch {
    return unauthorized();
  }
  const { operation } = await ctx.params;
  const params = request.nextUrl.searchParams;
  try {
    return await transaction(async (client) => {
      const db = client as unknown as SQL;
      if (operation === "stats") {
        const study = params.get("study") || "E1";
        if (study !== "E1" && study !== "E2")
          return NextResponse.json(
            { error: "Unknown study." },
            { status: 400, headers: noStore },
          );
        return NextResponse.json(await studyStats(db, study), {
          headers: noStore,
        });
      }
      if (operation === "export") {
        const table = params.get("table") || "";
        if (!Object.hasOwn(exportQueries, table))
          return NextResponse.json(
            { error: "Unknown export dataset." },
            { status: 400 },
          );
        const { rows, columns } = await exportRows(db, table as ExportName);
        await audit(db, actor, `export:${table}`);
        return new Response(toCsv(rows, columns), {
          headers: {
            ...noStore,
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="${table}.csv"`,
          },
        });
      }
      if (operation === "codebook") {
        const markdown = params.get("format") === "md";
        await audit(
          db,
          actor,
          `export:${markdown ? "data_dictionary" : "codebook"}`,
        );
        return new Response(
          markdown
            ? dataDictionaryMarkdown()
            : JSON.stringify(codebook(), null, 2),
          {
            headers: {
              ...noStore,
              "Content-Type": markdown
                ? "text/markdown; charset=utf-8"
                : "application/json; charset=utf-8",
              "Content-Disposition": `attachment; filename="${markdown ? "data_dictionary.md" : "codebook.json"}"`,
            },
          },
        );
      }
      if (operation === "rating")
        return NextResponse.json(
          await nextForRater(db, actorCode(actor), params.get("kind")),
          { headers: noStore },
        );
      if (operation === "adjudication")
        return NextResponse.json(
          await adjudicationQueue(db, params.get("kind")),
          {
            headers: noStore,
          },
        );
      return NextResponse.json(
        { error: "Unknown admin operation." },
        { status: 404 },
      );
    });
  } catch {
    return NextResponse.json(
      { error: "The research database could not be read." },
      { status: 503, headers: noStore },
    );
  }
}
export async function POST(request: NextRequest, ctx: Ctx) {
  if (!sameOrigin(request)) return new Response(null, { status: 403 });
  const { operation } = await ctx.params;
  if (operation === "logout") {
    // Revoke the Supabase session too, so a copied token stops working.
    const token =
      request.cookies.get(adminCookie)?.value ??
      request.cookies.get(adminMfaCookie)?.value;
    if (token)
      await supabaseAuth("logout?scope=local", { method: "POST", token }).catch(
        () => undefined,
      );
    const response = NextResponse.json(
      { signedOut: true },
      { headers: noStore },
    );
    response.cookies.delete(adminCookie);
    response.cookies.delete(adminMfaCookie);
    return response;
  }
  if (operation !== "rating" && operation !== "adjudication")
    return new Response(null, { status: 404 });
  let actor: string;
  try {
    actor = await requireAdmin();
  } catch {
    return unauthorized();
  }
  try {
    const text = await request.text();
    if (text.length > 4096) return new Response(null, { status: 413 });
    const body = JSON.parse(text);
    return await transaction(async (client) => {
      const db = client as unknown as SQL;
      const code = actorCode(actor);
      const result =
        operation === "rating"
          ? await submitRating(db, code, body)
          : await submitAdjudication(db, code, body);
      await audit(db, actor, operation);
      return NextResponse.json(result, { headers: noStore });
    });
  } catch {
    return NextResponse.json(
      { error: "The rating could not be saved. Check every criterion." },
      { status: 400, headers: noStore },
    );
  }
}
