import "server-only";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "../env";
import * as schema from "./schema";
import type { Db } from "./types";

export type { Db } from "./types";
export { schema };

/**
 * One database connection pool for the whole server.
 *
 * Kept on `globalThis`, not in this module: Next.js can load a module more
 * than once (the routing guard, route handlers and pages are bundled apart, and
 * development reloads on every edit), and each copy would otherwise open its
 * own pool.
 *
 * node-postgres sends a query and its values to the database in one round
 * trip, where postgres.js (without prepared statements, which Supabase's
 * pooler doesn't keep) takes two. Far from the database, that is most of a request.
 */
const store = globalThis as typeof globalThis & { __afterboxDb?: Promise<Db> };

async function connect(): Promise<Db> {
  const { testMode, production, DATABASE_URL } = env();

  // End-to-end test mode: Postgres in-process, so tests never touch Supabase.
  if (testMode) {
    const { createPgliteDb } = await import("./pglite");
    return (await createPgliteDb()).db;
  }

  const pool = new Pool({
    connectionString: DATABASE_URL,
    max: 5,
    connectionTimeoutMillis: 15_000,
    // Opening a connection is the slow part (a few seconds from far away). In
    // development keep them open; in production, next to the database, let idle ones go.
    idleTimeoutMillis: production ? 20_000 : 0,
  });
  // A connection dropped while idle (the pooler restarting, say) is replaced on next use.
  // Without a listener it would stop the server. The kind of error only: never its details.
  pool.on("error", (error) => {
    console.error(`[afterbox] An idle database connection closed (${(error as { code?: string }).code ?? error.name}).`);
  });
  return drizzle(pool, { schema }) as unknown as Db;
}

export function getDb(): Promise<Db> {
  store.__afterboxDb ??= connect().catch((error) => {
    // Let the next request try again rather than keeping a failed connection for good.
    store.__afterboxDb = undefined;
    throw error;
  });
  return store.__afterboxDb;
}
