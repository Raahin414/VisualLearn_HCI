// Disposable, loopback-only PostgreSQL for SYNTHETIC integration tests.
// Usage: node scripts/pg-harness.mjs <test|connected|up|down>
// Never point this at staging or production: it opens E1 with a SYNTHETIC,
// unapproved consent fixture so the real enrollment gate can be exercised.
import { execFileSync, spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import pg from "pg";
import { createRequire } from "node:module";
import path from "node:path";
const require = createRequire(import.meta.url);
const NAME = "visuallearn-synthetic-pg";
const PORT = Number(process.env.VISUALLEARN_PG_PORT || 15439);
const DB = "visuallearn_synthetic";
const STATE = new URL("../.local/pg-harness.json", import.meta.url);
const docker = (...args) =>
  execFileSync("docker", args, { encoding: "utf8" }).trim();
const secret = () => randomBytes(24).toString("hex");
async function up() {
  const existing = docker("ps", "-aq", "--filter", `name=^${NAME}$`);
  if (existing) docker("rm", "-f", NAME);
  const owner = secret();
  execFileSync("docker", [
    "run", "-d", "--rm", "--name", NAME,
    "--label", "visuallearn.synthetic=true",
    "-p", `127.0.0.1:${PORT}:5432`,
    "--tmpfs", "/var/lib/postgresql/data",
    "-e", "POSTGRES_PASSWORD", "-e", `POSTGRES_DB=${DB}`,
    "postgres:17-alpine",
  ], { encoding: "utf8", env: { ...process.env, POSTGRES_PASSWORD: owner } });
  const ownerUrl = `postgres://postgres:${owner}@127.0.0.1:${PORT}/${DB}`;
  for (let i = 0; ; i++) {
    const client = new pg.Client({ connectionString: ownerUrl });
    try {
      await client.connect();
      await client.query("select 1");
      await client.end();
      break;
    } catch {
      await client.end().catch(() => {});
      if (i > 60) throw new Error("PostgreSQL did not become ready.");
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  // The real migration CLI, exactly as an operator would run it (twice: idempotent).
  for (let run = 0; run < 2; run++)
    execFileSync("node", ["scripts/migrate.mjs"], {
      env: { ...process.env, DATABASE_URL: ownerUrl },
      stdio: "inherit",
    });
  const app = secret();
  const client = new pg.Client({ connectionString: ownerUrl });
  await client.connect();
  await client.query(
    await readFile(new URL("../supabase/roles/runtime_role.sql", import.meta.url), "utf8"),
  );
  await client.query(`alter role visuallearn_app with login password '${app}'`);
  // Supabase API roles, to prove they cannot reach the private schema.
  await client.query(
    "do $$ begin if not exists(select 1 from pg_roles where rolname='anon') then create role anon nologin; end if; if not exists(select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin; end if; end $$",
  );
  await client.query(
    await readFile(new URL("../tests/postgres/synthetic-open-e1.sql", import.meta.url), "utf8"),
  );
  await client.end();
  const state = {
    ownerUrl,
    appUrl: `postgres://visuallearn_app:${app}@127.0.0.1:${PORT}/${DB}`,
  };
  await mkdir(new URL("../.local/", import.meta.url), { recursive: true });
  await writeFile(STATE, JSON.stringify(state), { mode: 0o600 });
  return state;
}
async function down() {
  spawnSync("docker", ["rm", "-f", NAME], { stdio: "ignore" });
  await rm(STATE, { force: true });
}
function run(cmd, args, env) {
  const result = spawnSync(cmd, args, {
    stdio: "inherit",
    env: { ...process.env, ...env },
  });
  return result.status ?? 1;
}
const mode = process.argv[2] || "test";
if (mode === "down") await down();
else if (mode === "up") {
  await up();
  console.log(`SYNTHETIC PostgreSQL is running on 127.0.0.1:${PORT}. Connection details: .local/pg-harness.json (ignored).`);
} else {
  let status = 1;
  try {
    const state = await up();
    const env = {
      PG_OWNER_URL: state.ownerUrl,
      PG_APP_URL: state.appUrl,
      VISUALLEARN_SYNTHETIC_DB: "1",
    };
    status =
      mode === "connected"
        ? run(process.execPath, [require.resolve("@playwright/test/cli"), "test", "--config=playwright.connected.config.ts", ...process.argv.slice(3)], env)
        : run(process.execPath, [path.join(path.dirname(require.resolve("vitest/package.json")), "vitest.mjs"), "run", "--config", "vitest.pg.config.mts", ...process.argv.slice(3)], env);
  } finally {
    if (!process.env.KEEP_SYNTHETIC_PG) await down();
  }
  process.exit(status);
}
