import { describe, expect, it } from "vitest";
import { EnvError, parseEnv } from "@/server/env";

const complete = {
  DATABASE_URL: "postgresql://user:hunter2-database-password@db.example.com:5432/postgres",
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_SECRET_KEY: "sb_secret_do-not-print-me",
  BETTER_AUTH_SECRET: "a-long-random-string-that-must-not-be-printed",
  BETTER_AUTH_URL: "http://localhost:3000",
  RESEND_API_KEY: "re_do-not-print-me",
};

const problemsWith = (source: Record<string, string | undefined>) => {
  try {
    parseEnv(source);
  } catch (error) {
    expect(error).toBeInstanceOf(EnvError);
    return (error as Error).message;
  }
  throw new Error("Expected the environment to be refused.");
};

describe("the environment", () => {
  it("is accepted when everything required is there", () => {
    const env = parseEnv(complete);
    expect(env.googleEnabled).toBe(false);
    expect(env.testMode).toBe(false);
    expect(env.production).toBe(false);
  });

  it("names every missing variable, clearly", () => {
    const message = problemsWith({ BETTER_AUTH_URL: "http://localhost:3000" });
    for (const name of ["DATABASE_URL", "SUPABASE_URL", "SUPABASE_SECRET_KEY", "BETTER_AUTH_SECRET", "RESEND_API_KEY"]) {
      expect(message).toContain(name);
    }
    expect(message).toContain(".env.example");
  });

  it("never prints a value, even a wrong one", () => {
    const message = problemsWith({
      ...complete,
      SUPABASE_URL: "not-a-url-but-still-private",
      BETTER_AUTH_SECRET: "too-short-secret",
    });
    expect(message).toContain("SUPABASE_URL");
    expect(message).toContain("BETTER_AUTH_SECRET");
    expect(message).not.toContain("not-a-url-but-still-private");
    expect(message).not.toContain("too-short-secret");
    for (const value of Object.values(complete)) expect(message).not.toContain(value);
  });

  it("treats empty optional values as not set", () => {
    const env = parseEnv({ ...complete, GOOGLE_CLIENT_ID: "", GOOGLE_CLIENT_SECRET: "  " });
    expect(env.googleEnabled).toBe(false);
  });

  it("switches Google on only when both of its keys are set", () => {
    expect(parseEnv({ ...complete, GOOGLE_CLIENT_ID: "id", GOOGLE_CLIENT_SECRET: "secret" }).googleEnabled).toBe(true);
    expect(problemsWith({ ...complete, GOOGLE_CLIENT_ID: "id" })).toContain("GOOGLE_CLIENT_SECRET");
    expect(problemsWith({ ...complete, GOOGLE_CLIENT_SECRET: "secret" })).toContain("GOOGLE_CLIENT_ID");
  });

  it("refuses to start in production with the test hooks open", () => {
    expect(parseEnv({ ...complete, E2E_TEST_MODE: "1" }).testMode).toBe(true);
    expect(problemsWith({ ...complete, E2E_TEST_MODE: "1", NODE_ENV: "production" })).toContain("E2E_TEST_MODE");
  });
});
