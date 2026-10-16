import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  use: { baseURL: "http://127.0.0.1:3000", trace: "retain-on-failure" },
  projects: [
    { name: "chromium-production", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: "npm start",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    env: { APP_BASE_URL: "http://127.0.0.1:3000", STUDY_ENABLED: "false" },
  },
});
