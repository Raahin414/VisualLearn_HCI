// Local Supabase rehearsal for SYNTHETIC end-to-end tests (Auth + PostgreSQL).
// Requires Docker and the Supabase CLI (SUPABASE_CLI=path, default `npx supabase`).
// Usage: node scripts/supabase-harness.mjs [playwright args...]
// Resets ONLY the local stack. Never run against a linked remote project.
import { execFileSync, spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import pg from "pg";
const cli = process.env.SUPABASE_CLI ? [process.env.SUPABASE_CLI] : ["npx", "--yes", "supabase@2"];
const sb = (...args) =>
  execFileSync(cli[0], [...cli.slice(1), ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] });
if (existsSync(new URL("../supabase/.temp/project-ref", import.meta.url)))
  throw new Error("This checkout is linked to a remote Supabase project. Unlink before running local resets.");
let status;
try {
  status = JSON.parse(sb("status", "-o", "json"));
} catch {
  sb("start", "-x", "studio,imgproxy,storage-api,realtime,edge-runtime,logflare,vector,supavisor,mailpit,postgres-meta");
  status = JSON.parse(sb("status", "-o", "json"));
}
const ownerUrl = status.DB_URL;
if (!/@127\.0\.0\.1:/.test(ownerUrl)) throw new Error("Expected a loopback local Supabase database.");
sb("db", "reset");
const run = (cmd, args, env = {}) => {
  const r = spawnSync(cmd, args, { stdio: "inherit", env: { ...process.env, ...env } });
  if (r.status) throw new Error(`${cmd} ${args.join(" ")} failed`);
};
run("node", ["scripts/migrate.mjs"], { DATABASE_URL: ownerUrl });
const appPassword = randomBytes(24).toString("hex");
const owner = new pg.Client({ connectionString: ownerUrl });
await owner.connect();
await owner.query(await readFile(new URL("../supabase/roles/runtime_role.sql", import.meta.url), "utf8"));
await owner.query(`alter role visuallearn_app with login password '${appPassword}'`);
const appUrl = ownerUrl.replace(/\/\/postgres:[^@]+@/, `//visuallearn_app:${appPassword}@`);
// SYNTHETIC researcher accounts via the Auth admin API (local service key only).
const authUrl = status.API_URL;
const service = status.SERVICE_ROLE_KEY;
async function createUser(label) {
  const email = `${label}@synthetic.invalid`;
  const password = `Syn-${randomBytes(12).toString("base64url")}`;
  const r = await fetch(`${authUrl}/auth/v1/admin/users`, {
    method: "POST",
    headers: { apikey: service, Authorization: `Bearer ${service}`, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, email_confirm: true, app_metadata: { synthetic: true } }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(`Could not create ${email}: ${JSON.stringify(data)}`);
  return { id: data.id, email, password };
}
const researchers = [await createUser("researcher-one"), await createUser("researcher-two")];
const outsider = await createUser("not-allowlisted");
// Real invitation links, exactly as Supabase emails them (admin generate_link).
async function invite(label, redirect) {
  const email = `${label}@synthetic.invalid`;
  const r = await fetch(`${authUrl}/auth/v1/admin/generate_link`, {
    method: "POST",
    headers: { apikey: service, Authorization: `Bearer ${service}`, "Content-Type": "application/json" },
    body: JSON.stringify({ type: "invite", email, redirect_to: redirect }),
  });
  const data = await r.json();
  if (!r.ok || !data.action_link) throw new Error(`Could not invite ${email}: ${JSON.stringify(data)}`);
  return { id: data.id ?? data.user?.id, email, link: data.action_link };
}
const invites = {
  invited: await invite("invited-researcher", "http://127.0.0.1:3100/admin/accept"),
  outsider: await invite("invited-not-allowlisted", "http://127.0.0.1:3100/admin/accept"),
  // Lands on the site root, as links do when only the Site URL is configured.
  root: await invite("invited-site-root", "http://127.0.0.1:3100/"),
};
const allowlist = [...researchers.map((r) => r.id), invites.invited.id, invites.root.id].join(",");
// Staging verifier against the pristine (closed) local project.
run("node", ["scripts/verify-staging.mjs"], {
  DATABASE_URL: ownerUrl,
  APP_DATABASE_URL: appUrl,
  SUPABASE_URL: authUrl,
  SUPABASE_ANON_KEY: status.ANON_KEY,
  ADMIN_ALLOWLIST: allowlist,
});
await owner.query(await readFile(new URL("../tests/postgres/synthetic-open-e1.sql", import.meta.url), "utf8"));
await owner.end();
await mkdir(new URL("../.local/", import.meta.url), { recursive: true });
await writeFile(
  new URL("../.local/connected.json", import.meta.url),
  JSON.stringify({ ownerUrl, appUrl, authUrl, anonKey: status.ANON_KEY, jwtSecret: status.JWT_SECRET, serviceKey: service, researchers, outsider, invites, allowlist }),
  { mode: 0o600 },
);
const result = spawnSync(
  "npx",
  ["playwright", "test", "--config=playwright.connected.config.ts", ...process.argv.slice(2)],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      CONNECTED_DATABASE_URL: appUrl,
      CONNECTED_SESSION_SECRET: randomBytes(32).toString("hex"),
      CONNECTED_SUPABASE_URL: authUrl,
      CONNECTED_SUPABASE_ANON_KEY: status.ANON_KEY,
      CONNECTED_ADMIN_ALLOWLIST: allowlist,
    },
  },
);
process.exit(result.status ?? 1);
