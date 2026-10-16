import { sameOrigin } from "@/lib/security/origin";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, adminCookie } from "@/lib/security/admin";
import { hashToken } from "@/lib/security/tokens";
import { transaction } from "@/lib/db/client";
import {
  exportQueries,
  deidentify,
  toCsv,
  studyStats,
  type ExportName,
} from "@/lib/admin/exports";
import type { SQL } from "@/lib/study/service";
export const dynamic = "force-dynamic";
export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ operation: string }> },
) {
  let actor: string;
  try {
    actor = await requireAdmin();
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "UNAUTHORIZED",
          message: "Researcher sign-in required.",
        },
      },
      { status: 401 },
    );
  }
  try {
    const { operation } = await ctx.params;
    return await transaction(async (client) => {
      if (operation === "stats")
        return NextResponse.json(await studyStats(client as unknown as SQL), {
          headers: { "Cache-Control": "no-store" },
        });
      if (operation === "export") {
        const table = request.nextUrl.searchParams.get("table") || "";
        if (!Object.hasOwn(exportQueries, table))
          return NextResponse.json(
            { error: "Unknown export dataset." },
            { status: 400 },
          );
        const result = await client.query(exportQueries[table as ExportName]);
        const rows = result.rows.map(deidentify);
        const columns = result.fields.map((field) => field.name);
        await client.query(
          "insert into visuallearn.audit_log(actor_hash,action) values($1,$2)",
          [hashToken(actor), `export:${table}`],
        );
        return new Response(toCsv(rows, columns), {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="${table}.csv"`,
            "Cache-Control": "no-store",
          },
        });
      }
      return NextResponse.json(
        { error: "Unknown admin operation." },
        { status: 404 },
      );
    });
  } catch {
    return NextResponse.json(
      { error: "The research database could not be read." },
      { status: 503 },
    );
  }
}
export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ operation: string }> },
) {
  if (!sameOrigin(request)) return new Response(null, { status: 403 });
  const { operation } = await ctx.params;
  if (operation !== "logout") return new Response(null, { status: 404 });
  const response = NextResponse.json({ signedOut: true });
  response.cookies.delete(adminCookie);
  return response;
}
