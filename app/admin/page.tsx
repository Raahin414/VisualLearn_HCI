import { AdminWorkspace } from "@/components/admin/workspace";
import { requireAdmin } from "@/lib/security/admin";
import { transaction } from "@/lib/db/client";
import { studyStats } from "@/lib/admin/exports";
import type { SQL } from "@/lib/study/service";
export const dynamic = "force-dynamic";
export default async function Admin() {
  const configured = !!(
    process.env.SUPABASE_URL &&
    process.env.SUPABASE_ANON_KEY &&
    process.env.ADMIN_ALLOWLIST &&
    process.env.DATABASE_URL
  );
  let stats: Awaited<ReturnType<typeof studyStats>> | undefined;
  if (configured)
    try {
      await requireAdmin();
      stats = await transaction((client) =>
        studyStats(client as unknown as SQL),
      );
    } catch {}
  return (
    <main id="main" className="container prose-page">
      <div className="eyebrow">RESEARCHER ACCESS</div>
      <h1>Research workspace</h1>
      <AdminWorkspace
        configured={configured}
        signedIn={!!stats}
        initialStats={stats}
      />
    </main>
  );
}
