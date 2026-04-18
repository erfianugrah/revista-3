import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 4,
  reporter: "list",
  use: {
    baseURL: "http://localhost:4321",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
  webServer: {
    command: "bun run preview",
    port: 4321,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
