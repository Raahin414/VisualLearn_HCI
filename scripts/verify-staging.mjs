// Read-only security/configuration audit for a Supabase staging (or local)
// project. It never writes data. Exit code 1 if any check fails.
//   DATABASE_URL       migration/admin connection (read-only queries only)
//   APP_DATABASE_URL   runtime login used by the app (optional but recommended)
//   SUPABASE_URL, SUPABASE_ANON_KEY   public API endpoint and anon key
//   ADMIN_ALLOWLIST    researcher UUIDs (optional; checked to exist in auth.users)
// Flags: --allow-synthetic-open  accept an E1 opened by the SYNTHETIC local fixture.
import pg from "pg";
const env = process.env;
const allowSyntheticOpen = process.argv.includes("--allow-synthetic-open");
const results = [];
const check = (name, ok, detail = "") => results.push({ name, ok: !!ok, detail });
if (!env.DATABASE_URL || !env.SUPABASE_URL || !env.SUPABASE_ANON_KEY)
  throw new Error("Set DATABASE_URL, SUPABASE_URL and SUPABASE_ANON_KEY.");
const admin = new pg.Client({ connectionString: env.DATABASE_URL });
await admin.connect();
const q = async (sql, params) => (await admin.query(sql, params)).rows;
try {
  await admin.query("begin read only");
  const ledger = await q(
    "select to_regclass('visuallearn_ops.migrations') ops, to_regclass('public.visuallearn_migrations') legacy",
  );
  check("Migration ledger is private (visuallearn_ops)", ledger[0].ops && !ledger[0].legacy);
  if (ledger[0].ops) {
    const v = (await q("select version from visuallearn_ops.migrations order by 1")).map((r) => r.version);
    check("Migrations 001 and 002 applied", ["001", "002"].every((x) => v.includes(x)), v.join(","));
  }
  const rls = await q(
    "select c.relname from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='visuallearn' and c.relkind='r' and not c.relrowsecurity",
  );
  check("RLS enabled on every research table", !rls.length, rls.map((r) => r.relname).join(","));
  const apiRoles = (await q("select rolname from pg_roles where rolname in ('anon','authenticated','service_role')")).map((r) => r.rolname);
  for (const role of apiRoles) {
    const s = await q(
      "select has_schema_privilege($1,'visuallearn','USAGE') u, has_schema_privilege($1,'visuallearn_ops','USAGE') o",
      [role],
    );
    check(`${role} has no usage on private schemas`, !s[0].u && !s[0].o);
  }
  const grants = await q(
    "select grantee,table_schema,table_name from information_schema.role_table_grants where table_schema in ('visuallearn','visuallearn_ops') and grantee in ('anon','authenticated','service_role','PUBLIC')",
  );
  check("No table grants to API roles or PUBLIC in private schemas", !grants.length, grants.map((g) => `${g.grantee}:${g.table_name}`).join(","));
  const e = await q("select id,enabled,status,consent_version from visuallearn.experiments order by id");
  check("E2–E8 disabled", e.filter((x) => x.id !== "E1").every((x) => !x.enabled));
  const e1 = e.find((x) => x.id === "E1");
  const syntheticOpen = e1?.enabled && String(e1.consent_version || "").startsWith("SYNTHETIC");
  check(
    "Real enrollment closed (E1 not recruiting)",
    e1 && (!e1.enabled || e1.status !== "recruiting" || (allowSyntheticOpen && syntheticOpen)),
    e1 ? `${e1.status}/${e1.enabled ? "enabled" : "disabled"}${syntheticOpen ? "/SYNTHETIC fixture" : ""}` : "missing",
  );
  const people = await q(
    "select count(*)::int n, count(*) filter (where consent_version not like 'SYNTHETIC%')::int real from visuallearn.participants",
  );
  check("Only SYNTHETIC participants present", people[0].real === 0, `${people[0].n} participants`);
  if (env.ADMIN_ALLOWLIST) {
    const ids = env.ADMIN_ALLOWLIST.split(",").map((x) => x.trim()).filter(Boolean);
    const found = await q("select id::text from auth.users where id = any($1::uuid[])", [ids]).catch(() => null);
    check("Allowlisted researcher UUIDs exist in Supabase Auth", found && found.length === ids.length, found ? `${found.length}/${ids.length}` : "auth.users unreadable");
  }
  await admin.query("rollback");
} finally {
  await admin.end();
}
if (env.APP_DATABASE_URL) {
  const app = new pg.Client({ connectionString: env.APP_DATABASE_URL });
  await app.connect();
  try {
    const me = (
      await app.query(
        "select current_user u,rolsuper,rolbypassrls,rolcreaterole,rolcreatedb,(select count(*)::int from pg_tables where schemaname='visuallearn' and tableowner=current_user) owned from pg_roles where rolname=current_user",
      )
    ).rows[0];
    check(
      "Runtime login is non-owner without superuser/RLS bypass/role or DB creation",
      !me.rolsuper && !me.rolbypassrls && !me.rolcreaterole && !me.rolcreatedb && me.owned === 0,
      me.u,
    );
    let ddlBlocked = false;
    try {
      await app.query("begin");
      await app.query("create table visuallearn.verify_probe(x int)");
    } catch {
      ddlBlocked = true;
    } finally {
      await app.query("rollback").catch(() => {});
    }
    check("Runtime login cannot create tables", ddlBlocked);
    const auth = await app
      .query("select 1 from auth.users limit 1")
      .then(() => false)
      .catch(() => true);
    check("Runtime login cannot read Supabase auth.users", auth);
  } finally {
    await app.end();
  }
}
const base = env.SUPABASE_URL.replace(/\/$/, "");
const headers = { apikey: env.SUPABASE_ANON_KEY, Authorization: `Bearer ${env.SUPABASE_ANON_KEY}` };
const rest = await fetch(`${base}/rest/v1/participants?limit=1`, {
  headers: { ...headers, "Accept-Profile": "visuallearn" },
});
const restBody = await rest.text();
check("REST API refuses the visuallearn schema for anon", !rest.ok && /PGRST106|schema/i.test(restBody), `${rest.status}`);
const openapi = await fetch(`${base}/rest/v1/`, { headers }).then((r) => r.text());
check(
  "Public REST schema lists no research tables",
  !/participants|assessment_attempts|visuallearn_migrations|survey_submissions/.test(openapi),
);
const settings = await fetch(`${base}/auth/v1/settings`, { headers: { apikey: env.SUPABASE_ANON_KEY } }).then((r) => r.json());
check("Public sign-up disabled", settings.disable_signup === true);
check("Anonymous sign-in disabled", settings.external?.anonymous_users === false);
const signup = await fetch(`${base}/auth/v1/signup`, {
  method: "POST",
  headers: { apikey: env.SUPABASE_ANON_KEY, "Content-Type": "application/json" },
  body: JSON.stringify({ email: "verify-staging@synthetic.invalid", password: `Verify-${Date.now()}-x` }),
});
check("Sign-up request rejected", !signup.ok, `${signup.status}`);
const width = Math.max(...results.map((r) => r.name.length));
for (const r of results)
  console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name.padEnd(width)}  ${r.detail}`);
const failed = results.filter((r) => !r.ok).length;
console.log(failed ? `\n${failed} check(s) failed.` : `\nAll ${results.length} checks passed.`);
process.exit(failed ? 1 : 0);
