import { defineConfig, devices } from "@playwright/test";
// Connected SYNTHETIC suite: real app + local Supabase Auth + PostgreSQL.
// Run only through `npm run test:connected` (scripts/supabase-harness.mjs).
const env = process.env;
if (!env.CONNECTED_DATABASE_URL || !env.CONNECTED_SUPABASE_URL)
  throw new Error("Run the connected suite with `npm run test:connected`.");
export default defineConfig({
  testDir: "./tests/connected",
  fullyParallel: false,
  workers: 1,
  timeout: 180_000,
  use: { baseURL: "http://127.0.0.1:3100", trace: "retain-on-failure" },
  projects: [{ name: "connected-chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npx next dev --hostname 127.0.0.1 --port 3100",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      DATABASE_URL: env.CONNECTED_DATABASE_URL,
      SESSION_SECRET: env.CONNECTED_SESSION_SECRET!,
      STUDY_ENABLED: "true",
      APP_BASE_URL: "http://127.0.0.1:3100",
      SUPABASE_URL: env.CONNECTED_SUPABASE_URL,
      SUPABASE_ANON_KEY: env.CONNECTED_SUPABASE_ANON_KEY!,
      ADMIN_ALLOWLIST: env.CONNECTED_ADMIN_ALLOWLIST!,
      ADMIN_REQUIRE_MFA: "true",
    },
  },
});
