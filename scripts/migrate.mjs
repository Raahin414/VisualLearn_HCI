import { readFile } from "node:fs/promises";
import pg from "pg";
if (!process.env.DATABASE_URL)
  throw new Error(
    "Set DATABASE_URL to an authorized PostgreSQL migration connection.",
  );
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  await client.query("BEGIN");
  await client.query("SELECT pg_advisory_xact_lock(71710414)");
  await client.query(
    "CREATE TABLE IF NOT EXISTS public.visuallearn_migrations(version text primary key,applied_at timestamptz not null default now())",
  );
  const existing = await client.query(
    "SELECT version FROM public.visuallearn_migrations WHERE version=$1",
    ["001"],
  );
  if (!existing.rowCount) {
    await client.query(
      await readFile(
        new URL(
          "../supabase/migrations/001_research_foundation.sql",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    await client.query(
      "INSERT INTO public.visuallearn_migrations(version) VALUES($1)",
      ["001"],
    );
  }
  await client.query(
    await readFile(new URL("../supabase/seed.sql", import.meta.url), "utf8"),
  );
  await client.query("COMMIT");
  console.log(
    "Applied migration 001 and draft-only seed. Recruitment remains disabled.",
  );
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  await client.end();
}
