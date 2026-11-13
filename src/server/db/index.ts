import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../env";
import * as schema from "./schema";
import type { Db } from "./types";

export type { Db } from "./types";
export { schema };

/**
 * One database connection for the whole server.
 *
 * Kept on `globalThis`, not in this module: Next.js can load a module more
 * than once (the routing guard, route handlers and pages are bundled apart, and
 * development reloads on every edit), and each copy would otherwise open its
 * own pool.
 */
const store = globalThis as typeof globalThis & { __afterboxDb?: Promise<Db> };

async function connect(): Promise<Db> {
  const { testMode, DATABASE_URL } = env();

  // End-to-end test mode: Postgres in-process, so tests never touch Supabase.
  if (testMode) {
    const { createPgliteDb } = await import("./pglite");
    return (await createPgliteDb()).db;
  }

  const client = postgres(DATABASE_URL, {
    max: 5,
    idle_timeout: 20,
    // Supabase's transaction pooler doesn't keep prepared statements; without them either connection string works.
    prepare: false,
    // Postgres notices can carry row contents. Keep them out of the logs.
    onnotice: () => {},
  });
  return drizzle(client, { schema }) as unknown as Db;
}

export function getDb(): Promise<Db> {
  store.__afterboxDb ??= connect().catch((error) => {
    // Let the next request try again rather than keeping a failed connection for good.
    store.__afterboxDb = undefined;
    throw error;
  });
  return store.__afterboxDb;
}
