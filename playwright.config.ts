import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  timeout: 30000,
  workers: 2,
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "retain-on-failure",
    ...devices["Desktop Chrome"],
  },
  webServer: [
    {
      command: "node tests/mock-api.mjs",
      url: "http://127.0.0.1:4100/health",
      reuseExistingServer: false,
    },
    {
      command: "npm run start -- --port 3100",
      url: "http://127.0.0.1:3100",
      env: {
        MEDIQUEUE_API_URL: "http://127.0.0.1:4100",
        SUPABASE_URL: "http://127.0.0.1:4100",
        SUPABASE_ANON_KEY: "fixture-anon",
        APP_ORIGIN: "http://127.0.0.1:3100",
      },
      reuseExistingServer: false,
    },
  ],
});
