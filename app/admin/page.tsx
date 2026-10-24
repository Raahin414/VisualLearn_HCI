import { cookies } from "next/headers";
import { AdminWorkspace } from "@/components/admin/workspace";
import {
  adminMfaCookie,
  requireAdmin,
  verifyAdminToken,
} from "@/lib/security/admin";
import { transaction } from "@/lib/db/client";
import { studyStats, type StudyStats } from "@/lib/admin/exports";
import type { SQL } from "@/lib/study/service";
export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };
export default async function Admin({
  searchParams,
}: {
  searchParams: Promise<{ study?: string }>;
}) {
  const requested = (await searchParams).study;
  const study = requested === "E2" || requested === "E3" ? requested : "E1";
  const configured = !!(
    process.env.SUPABASE_URL &&
    process.env.SUPABASE_ANON_KEY &&
    process.env.ADMIN_ALLOWLIST &&
    process.env.DATABASE_URL
  );
  let stats: StudyStats | undefined;
  let mfa: "enroll" | "verify" | null = null;
  if (configured) {
    try {
      await requireAdmin();
      stats = await transaction((client) =>
        studyStats(client as unknown as SQL, study),
      );
    } catch {
      const pending = (await cookies()).get(adminMfaCookie)?.value;
      if (pending)
        try {
          const user = await verifyAdminToken(pending, { requireAal2: false });
          mfa = user.verifiedTotp.length ? "verify" : "enroll";
        } catch {}
    }
  }
  return (
    <main id="main" className="container prose-page">
      <div className="eyebrow">RESEARCHER ACCESS</div>
      <h1>Research workspace</h1>
      <AdminWorkspace
        configured={configured}
        signedIn={!!stats}
        initialStats={stats}
        initialMfa={mfa}
      />
    </main>
  );
}
