import { defineConfig, devices } from "@playwright/test";

const PORT = 3200;
const E2E_ENV = {
  APP_ENV: "test",
  DATABASE_URL: process.env.E2E_DATABASE_URL ?? "postgres://hknr:hknr_local_dev@localhost:55433/hknr_e2e",
  STORAGE_DRIVER: "local",
  LOCAL_STORAGE_DIR: ".data/e2e-uploads",
  IP_HASH_SALT: "e2e-salt",
  SITE_URL: `http://localhost:${PORT}`,
  // The build output for e2e lives apart from the dev server's .next directory.
  NEXT_DIST_DIR: ".next-e2e",
};

export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testMatch: /public\.spec\.ts/ },
  ],
  webServer: {
    command: `npx tsx --conditions=react-server scripts/e2e-setup.ts && npx next build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    timeout: 300_000,
    reuseExistingServer: false,
    env: E2E_ENV,
    stdout: "pipe",
  },
});
