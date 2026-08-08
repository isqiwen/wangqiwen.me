import { defineConfig } from "@playwright/test";

const port = 3101;
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : "list",
  use: {
    baseURL,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "retain-on-failure",
  },
  webServer: {
    command: `NEXT_DIST_DIR=.next-e2e pnpm exec next dev --turbopack -H 127.0.0.1 --port ${port}`,
    url: `${baseURL}/editor`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
