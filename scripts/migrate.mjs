import { readFile, readdir } from "node:fs/promises";
import pg from "pg";
if (!process.env.DATABASE_URL)
  throw new Error(
    "Set DATABASE_URL to an authorized PostgreSQL migration connection.",
  );
const dir = new URL("../supabase/migrations/", import.meta.url);
const files = (await readdir(dir)).filter((f) => /^\d{3}_.+\.sql$/.test(f)).sort();
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  await client.query("BEGIN");
  await client.query("SELECT pg_advisory_xact_lock(71710414)");
  // Supabase grants anon/authenticated full access to new tables in `public`
  // and exposes them through the REST/GraphQL APIs. A public ledger would let
  // anyone insert a future version and make this script skip a migration, so
  // the ledger lives in an owner-only schema. A legacy public ledger cannot be
  // trusted: stop and have an operator verify the applied versions manually.
  const legacy = await client.query(
    "SELECT to_regclass('public.visuallearn_migrations') IS NOT NULL AS found",
  );
  if (legacy.rows[0].found)
    throw new Error(
      "Found legacy public.visuallearn_migrations. Verify applied versions against the schema, record them in visuallearn_ops.migrations, then drop the public table.",
    );
  await client.query("CREATE SCHEMA IF NOT EXISTS visuallearn_ops");
  await client.query("REVOKE ALL ON SCHEMA visuallearn_ops FROM PUBLIC");
  await client.query(
    "CREATE TABLE IF NOT EXISTS visuallearn_ops.migrations(version text primary key,applied_at timestamptz not null default now())",
  );
  await client.query("REVOKE ALL ON visuallearn_ops.migrations FROM PUBLIC");
  const applied = [];
  for (const file of files) {
    const version = file.slice(0, 3);
    const existing = await client.query(
      "SELECT version FROM visuallearn_ops.migrations WHERE version=$1",
      [version],
    );
    if (existing.rowCount) continue;
    await client.query(await readFile(new URL(file, dir), "utf8"));
    await client.query(
      "INSERT INTO visuallearn_ops.migrations(version) VALUES($1)",
      [version],
    );
    applied.push(version);
  }
  await client.query(
    await readFile(new URL("../supabase/seed.sql", import.meta.url), "utf8"),
  );
  await client.query("COMMIT");
  console.log(
    `${applied.length ? `Applied migrations ${applied.join(", ")}` : "No pending migrations"} and draft-only seed. Recruitment remains disabled.`,
  );
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  await client.end();
}
