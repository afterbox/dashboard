/**
 * The environment for tests: made-up values, and test mode, so the database is
 * PGlite and storage and email are in-memory stand-ins. Nothing here is real,
 * and .env.local is never read.
 */
Object.assign(process.env, {
  DATABASE_URL: "postgresql://test:test@127.0.0.1:1/test",
  SUPABASE_URL: "https://test.supabase.invalid",
  SUPABASE_SECRET_KEY: "sb_secret_test_only",
  BETTER_AUTH_SECRET: "test-only-secret-test-only-secret-0123456789",
  BETTER_AUTH_URL: "http://localhost:3000",
  RESEND_API_KEY: "re_test_only",
  E2E_TEST_MODE: "1",
  GOOGLE_CLIENT_ID: "",
  GOOGLE_CLIENT_SECRET: "",
});
