import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests (`npm run test:e2e`).
 *
 * They run the real app in end-to-end test mode (E2E_TEST_MODE=1): an
 * in-process database with the same migrations, stand-ins for storage and
 * email, and the test-only hooks under /api/test. Nothing here can reach the
 * real database, bucket or inbox: every secret below is a made-up value, and
 * the app refuses to start in test mode in production.
 */
const port = 3100;
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  testDir: "e2e",
  // One at a time: the tests share the app's one in-process database, and the dev server compiles pages as they are first asked for.
  workers: 1,
  fullyParallel: false,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  outputDir: "test-results/e2e",
  use: {
    baseURL,
    trace: "retain-on-failure",
    // The recorder is given a pretend microphone, and the question is answered for it.
    permissions: ["microphone"],
    launchOptions: { args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"] },
  },
  projects: [
    { name: "phone", use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 }, hasTouch: true } },
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
  ],
  webServer: {
    command: `npx next dev -p ${port}`,
    url: `${baseURL}/start/someone`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      E2E_TEST_MODE: "1",
      BETTER_AUTH_URL: baseURL,
      // Made up, and never used: test mode has its own database, storage and inbox.
      DATABASE_URL: "postgres://test:test@localhost:5432/test",
      SUPABASE_URL: "https://test.supabase.co",
      SUPABASE_SECRET_KEY: "sb_secret_test_only",
      BETTER_AUTH_SECRET: "test-only-secret-test-only-secret-0000",
      RESEND_API_KEY: "re_test_only",
      GOOGLE_CLIENT_ID: "",
      GOOGLE_CLIENT_SECRET: "",
    },
  },
});
