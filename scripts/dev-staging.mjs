// Run the app locally against the hosted STAGING project, e.g. to accept a
// researcher invitation before a hosted URL exists. Reads the ignored
// .env.staging.local, uses the restricted runtime login (never the admin
// connection) and always keeps research enrollment closed.
import { randomBytes } from "node:crypto";
import { appendFileSync, readFileSync } from "node:fs";
import { spawn } from "node:child_process";
const file = ".env.staging.local";
const env = Object.fromEntries(
  readFileSync(file, "utf8")
    .split("\n")
    .filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]),
);
for (const key of ["APP_DATABASE_URL", "SUPABASE_URL", "SUPABASE_ANON_KEY", "ADMIN_ALLOWLIST"])
  if (!env[key]) throw new Error(`${file} is missing ${key}. See docs/DEPLOYMENT.md.`);
if (!env.STAGING_SESSION_SECRET) {
  env.STAGING_SESSION_SECRET = randomBytes(32).toString("hex");
  appendFileSync(file, `STAGING_SESSION_SECRET=${env.STAGING_SESSION_SECRET}\n`, { mode: 0o600 });
}
spawn("npx", ["next", "dev", "--hostname", "127.0.0.1", "--port", "3000"], {
  stdio: "inherit",
  env: {
    ...process.env,
    DATABASE_URL: env.APP_DATABASE_URL,
    SESSION_SECRET: env.STAGING_SESSION_SECRET,
    SUPABASE_URL: env.SUPABASE_URL,
    SUPABASE_ANON_KEY: env.SUPABASE_ANON_KEY,
    ADMIN_ALLOWLIST: env.ADMIN_ALLOWLIST,
    APP_BASE_URL: "http://127.0.0.1:3000",
    STUDY_ENABLED: "false",
  },
}).on("exit", (code) => process.exit(code ?? 0));
