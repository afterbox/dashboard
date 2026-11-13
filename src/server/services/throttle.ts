import { sql } from "drizzle-orm";
import { throttle } from "../db/schema";
import type { Db } from "../db/types";

/**
 * A small limiter, kept in the database so it holds across servers and
 * restarts: at most `max` of something per `windowSeconds`, for a key.
 *
 * Used for sign-in codes, per email address: how often a code may be asked
 * for, and how many guesses may be made (src/server/auth.ts). Better Auth's
 * own limiter covers the same paths per IP address.
 */
export type Limit = { max: number; windowSeconds: number };

export type Hit = {
  allowed: boolean;
  /** When refused: how long until the window is over, in seconds. */
  retryAfterSeconds: number;
};

/**
 * Count one more for this key, and say whether it is still within the limit.
 * One statement, so two requests at once can't both read the old count.
 */
export async function hit(db: Db, key: string, limit: Limit, now: Date = new Date()): Promise<Hit> {
  // As text, cast in SQL: the same on every driver.
  const at = sql`${now.toISOString()}::timestamptz`;
  const windowStart = new Date(now.getTime() - limit.windowSeconds * 1000).toISOString();
  const expired = sql`${throttle.windowStartedAt} <= ${windowStart}::timestamptz`;

  const [row] = await db
    .insert(throttle)
    .values({ key, count: 1, windowStartedAt: now })
    .onConflictDoUpdate({
      target: throttle.key,
      set: {
        // A window that has run out starts again from one.
        count: sql`case when ${expired} then 1 else ${throttle.count} + 1 end`,
        windowStartedAt: sql`case when ${expired} then ${at} else ${throttle.windowStartedAt} end`,
      },
    })
    .returning({ count: throttle.count, windowStartedAt: throttle.windowStartedAt });

  const allowed = row.count <= limit.max;
  const windowEnds = row.windowStartedAt.getTime() + limit.windowSeconds * 1000;
  return { allowed, retryAfterSeconds: allowed ? 0 : Math.max(1, Math.ceil((windowEnds - now.getTime()) / 1000)) };
}

/**
 * The key for an email address. Hashed, so the table holds no addresses.
 * `purpose` keeps the counters for asking and for guessing apart.
 */
export async function emailKey(purpose: string, email: string) {
  const bytes = new TextEncoder().encode(email.trim().toLowerCase());
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const hex = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
  return `${purpose}:${hex}`;
}
