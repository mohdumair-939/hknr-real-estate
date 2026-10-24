import path from "node:path";
import { defineConfig } from "vitest/config";

const TEST_DB = process.env.TEST_DATABASE_URL ?? "postgres://hknr:hknr_local_dev@localhost:55433/hknr_test";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      // Server-only guard is irrelevant in tests.
      "server-only": path.resolve(__dirname, "tests/support/empty.ts"),
    },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    globalSetup: ["tests/support/global-setup.ts"],
    setupFiles: ["tests/support/setup.ts"],
    // Integration tests share one database; run files sequentially.
    fileParallelism: false,
    env: {
      APP_ENV: "test",
      DATABASE_URL: TEST_DB,
      STORAGE_DRIVER: "local",
      LOCAL_STORAGE_DIR: ".data/test-uploads",
      IP_HASH_SALT: "test-salt",
    },
  },
});
