import "server-only";
import { z } from "zod";

/**
 * The environment, checked once.
 *
 * Read env only through here, and never print a value: errors name the
 * variable and say what is wrong with it, nothing more.
 */

/** A value left empty in .env.local (GOOGLE_CLIENT_ID=) counts as not set. */
const optional = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().optional(),
);
const required = (what: string) => z.string({ error: `is missing (${what})` }).min(1, `is empty (${what})`);
const url = (what: string) =>
  required(what).refine((value) => URL.canParse(value), `is not a full address, such as https://… (${what})`);

const schema = z
  .object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    DATABASE_URL: required("the Supabase Postgres connection string"),
    SUPABASE_URL: url("the Supabase project URL"),
    SUPABASE_SECRET_KEY: required("the Supabase secret key, sb_secret_…"),
    BETTER_AUTH_SECRET: required("a long random string").min(32, "must be at least 32 characters"),
    BETTER_AUTH_URL: url("this app's own address"),
    RESEND_API_KEY: required("the Resend API key"),
    EMAIL_FROM: optional,
    GOOGLE_CLIENT_ID: optional,
    GOOGLE_CLIENT_SECRET: optional,
    TRUELAYER_CLIENT_ID: optional,
    TRUELAYER_CLIENT_SECRET: optional,
    TRUELAYER_ENV: optional,
    E2E_TEST_MODE: optional,
  })
  .superRefine((env, ctx) => {
    if (Boolean(env.GOOGLE_CLIENT_ID) !== Boolean(env.GOOGLE_CLIENT_SECRET)) {
      ctx.addIssue({
        code: "custom",
        path: [env.GOOGLE_CLIENT_ID ? "GOOGLE_CLIENT_SECRET" : "GOOGLE_CLIENT_ID"],
        message: "is missing (Google sign-in needs both GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET, or neither)",
      });
    }
    if (env.E2E_TEST_MODE === "1" && env.NODE_ENV === "production") {
      ctx.addIssue({
        code: "custom",
        path: ["E2E_TEST_MODE"],
        message: "must never be set in production: it opens test-only hooks",
      });
    }
  });

export type Env = z.infer<typeof schema> & {
  /** Google sign-in is configured. */
  googleEnabled: boolean;
  /** End-to-end test mode: an in-process database, stand-ins for storage and email, test-only hooks. Never in production. */
  testMode: boolean;
  production: boolean;
};

export class EnvError extends Error {
  constructor(problems: string[]) {
    super(
      `afterbox can't start: check the environment (.env.local).\n${problems.map((p) => `  - ${p}`).join("\n")}\n` +
        "The names are listed in .env.example.",
    );
    this.name = "EnvError";
  }
}

/** Check a set of variables. Exported for tests; the app calls `env()`. */
export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = schema.safeParse(source);
  if (!result.success) {
    // Names and reasons only. Never the values.
    throw new EnvError(result.error.issues.map((issue) => `${issue.path.join(".")} ${issue.message}`));
  }
  const data = result.data;
  return {
    ...data,
    googleEnabled: Boolean(data.GOOGLE_CLIENT_ID && data.GOOGLE_CLIENT_SECRET),
    testMode: data.E2E_TEST_MODE === "1" && data.NODE_ENV !== "production",
    production: data.NODE_ENV === "production",
  };
}

let cached: Env | undefined;

/** The checked environment. Throws a clear error, once, if anything is missing. */
export function env(): Env {
  cached ??= parseEnv(process.env);
  return cached;
}
