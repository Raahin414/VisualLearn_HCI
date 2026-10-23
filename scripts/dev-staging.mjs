// Run the app locally against the hosted STAGING project, e.g. to accept a
// researcher invitation before a hosted URL exists. Reads the ignored
// .env.staging.local, uses the restricted runtime login (never the admin
// connection) and always keeps research enrollment closed.
import { randomBytes } from "node:crypto";
import { appendFileSync, readFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { parseEnv } from "node:util";
const require = createRequire(import.meta.url);
const file = ".env.staging.local";
const env = parseEnv(readFileSync(file, "utf8"));
for (const key of ["APP_DATABASE_URL", "SUPABASE_URL", "SUPABASE_ANON_KEY", "ADMIN_ALLOWLIST"])
  if (!env[key]) throw new Error(`${file} is missing ${key}. See docs/DEPLOYMENT.md.`);
if (!env.STAGING_SESSION_SECRET) {
  env.STAGING_SESSION_SECRET = randomBytes(32).toString("hex");
  appendFileSync(file, `\nSTAGING_SESSION_SECRET=${env.STAGING_SESSION_SECRET}\n`, { mode: 0o600 });
}
// Launch the installed CLI directly; Windows cannot spawn the npx shim.
spawn(process.execPath, [require.resolve("next/dist/bin/next"), "dev", "--hostname", "127.0.0.1", "--port", "3000"], {
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
})
  .on("error", (error) => {
    console.error(`Unable to start Next.js: ${error.message}`);
    process.exitCode = 1;
  })
  .on("exit", (code) => process.exit(code ?? 1));
