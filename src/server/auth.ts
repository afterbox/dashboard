import "server-only";
import { createAuth, type Auth } from "./auth-config";
import { getDb } from "./db";
import { sendCode } from "./email";
import { env } from "./env";

/**
 * The app's sign-in, made once per server from the environment
 * (see ./auth-config.ts for what it does).
 */
let auth: Promise<Auth> | undefined;

async function build(): Promise<Auth> {
  const e = env();
  return createAuth({
    db: await getDb(),
    baseURL: e.BETTER_AUTH_URL,
    secret: e.BETTER_AUTH_SECRET,
    production: e.production,
    sendCode,
    google: e.googleEnabled
      ? { clientId: e.GOOGLE_CLIENT_ID as string, clientSecret: e.GOOGLE_CLIENT_SECRET as string }
      : undefined,
    // End-to-end tests sign in many times from one address; the per-email limits still apply.
    limits: e.testMode ? { perAddress: false } : undefined,
  });
}

export function getAuth(): Promise<Auth> {
  auth ??= build().catch((error) => {
    auth = undefined;
    throw error;
  });
  return auth;
}
