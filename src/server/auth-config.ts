import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware, getSessionFromCtx } from "better-auth/api";
import { anonymous, emailOTP } from "better-auth/plugins";
import { asc, eq } from "drizzle-orm";
import * as schema from "./db/schema";
import type { Db } from "./db/types";
import type { SendCode } from "./email";
import { moveGuestData } from "./services/link";
import { emailKey, hit, type Limit } from "./services/throttle";

/**
 * Sign-in (Better Auth), built from its parts so tests can make one against an
 * in-process database with a stand-in for email. The app's own instance is in
 * ./auth.ts.
 *
 * - Guests: the `anonymous` plugin gives someone a session from the first
 *   screen. When they sign in for real, `onLinkAccount` moves everything they
 *   made to the account, in one transaction, and the guest is removed.
 * - Sign-in: a 6-digit code by email (`emailOTP`). No passwords.
 * - Google: only when both of its keys are set.
 * - Sessions: an httpOnly cookie (Secure in production), 30 days, renewed
 *   daily while in use. "Sign out everywhere" is `/revoke-sessions`.
 */

export type AuthLimits = {
  /** Codes that may be asked for, per email address. */
  codeRequests: Limit;
  /** Guesses that may be made, per email address, across codes. */
  codeAttempts: Limit;
  /** Better Auth's own limiter, per IP address and path. */
  perAddress: boolean;
};

export const defaultLimits: AuthLimits = {
  codeRequests: { max: 5, windowSeconds: 15 * 60 },
  codeAttempts: { max: 10, windowSeconds: 15 * 60 },
  perAddress: true,
};

/** Each code: 6 digits, 5 minutes, 3 guesses. */
export const codeRules = { length: 6, expiresInSeconds: 5 * 60, attempts: 3 } as const;

export type AuthDeps = {
  db: Db;
  /** This app's own address. */
  baseURL: string;
  secret: string;
  production: boolean;
  sendCode: SendCode;
  google?: { clientId: string; clientSecret: string };
  limits?: Partial<AuthLimits>;
  /** The clock, for tests. */
  now?: () => Date;
};

const tooMany = (retryAfterSeconds: number, message: string) =>
  new APIError("TOO_MANY_REQUESTS", { message, code: "TOO_MANY_REQUESTS", retryAfterSeconds });

const minutes = (seconds: number) => {
  const m = Math.ceil(seconds / 60);
  return m <= 1 ? "a minute" : `${m} minutes`;
};

export function createAuth(deps: AuthDeps) {
  const { db } = deps;
  const limits = { ...defaultLimits, ...deps.limits };
  const now = deps.now ?? (() => new Date());

  /** Who the gift is for, for the code email. The guest's own person, or the account's. */
  async function personNameFor(userId: string | undefined, email: string) {
    const ownerId =
      userId ?? (await db.select({ id: schema.user.id }).from(schema.user).where(eq(schema.user.email, email)))[0]?.id;
    if (!ownerId) return null;
    const [first] = await db
      .select({ name: schema.person.name })
      .from(schema.person)
      .where(eq(schema.person.ownerId, ownerId))
      .orderBy(asc(schema.person.createdAt))
      .limit(1);
    return first?.name ?? null;
  }

  return betterAuth({
    appName: "afterbox",
    baseURL: deps.baseURL,
    secret: deps.secret,
    database: drizzleAdapter(db, { provider: "pg", schema }),

    session: {
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
    },

    advanced: {
      cookiePrefix: "afterbox",
      useSecureCookies: deps.production,
    },

    socialProviders: deps.google ? { google: deps.google } : {},
    account: {
      // Someone who began with an email code can use Google with the same address later.
      accountLinking: { enabled: true, trustedProviders: ["google"] },
    },

    rateLimit: {
      enabled: limits.perAddress,
      storage: "database",
      window: 10,
      max: 100,
    },

    plugins: [
      anonymous({
        emailDomainName: "guest.afterbox.invalid",
        generateName: () => "",
        async onLinkAccount({ anonymousUser, newUser }) {
          // If this fails, sign-in fails and the guest keeps everything: nothing is half-moved.
          await moveGuestData(db, anonymousUser.user.id, newUser.user.id);
        },
      }),
      emailOTP({
        otpLength: codeRules.length,
        expiresIn: codeRules.expiresInSeconds,
        allowedAttempts: codeRules.attempts,
        storeOTP: "hashed",
        async sendVerificationOTP({ email, otp }, ctx) {
          const session = ctx ? await getSessionFromCtx(ctx).catch(() => null) : null;
          const personName = await personNameFor(session?.user.id, email).catch(() => null);
          await deps.sendCode({ to: email, code: otp, personName });
        },
      }),
    ],

    hooks: {
      // Per email address, whatever address the request comes from.
      before: createAuthMiddleware(async (ctx) => {
        const email = typeof ctx.body?.email === "string" ? ctx.body.email : null;
        if (!email) return;

        if (ctx.path === "/email-otp/send-verification-otp") {
          const { allowed, retryAfterSeconds } = await hit(
            db,
            await emailKey("code-request", email),
            limits.codeRequests,
            now(),
          );
          if (!allowed) {
            throw tooMany(
              retryAfterSeconds,
              `We've sent a few codes to that address already. Try again in ${minutes(retryAfterSeconds)}.`,
            );
          }
        } else if (ctx.path === "/sign-in/email-otp" || ctx.path?.startsWith("/email-otp/")) {
          const { allowed, retryAfterSeconds } = await hit(
            db,
            await emailKey("code-attempt", email),
            limits.codeAttempts,
            now(),
          );
          if (!allowed) {
            throw tooMany(
              retryAfterSeconds,
              `That's a few tries too many. Wait ${minutes(retryAfterSeconds)}, then ask for a new code.`,
            );
          }
        }
      }),
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
