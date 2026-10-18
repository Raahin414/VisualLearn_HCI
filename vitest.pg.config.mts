import { defineConfig } from "vitest/config";
import path from "node:path";
// Real multi-connection PostgreSQL suite; run through `npm run test:pg`.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      "server-only": path.resolve(__dirname, "tests/server-only.ts"),
    },
  },
  test: {
    include: ["tests/postgres/**/*.pg.test.ts"],
    environment: "node",
    fileParallelism: false,
    testTimeout: 30000,
  },
});
