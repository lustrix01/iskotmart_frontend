/* global process */
import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL || "http://localhost:5173";
const shouldStartServer = process.env.E2E_START_SERVER === "1";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: [["html"], ["list"]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: shouldStartServer
    ? {
        command: "npm run dev:local",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      }
    : undefined,
  projects: [
    {
      name: "auth setup",
      testMatch: /auth\.setup\.js/,
    },
    {
      name: "chromium",
      dependencies: ["auth setup"],
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],
});
