import path from "node:path";
import * as schema from "./schema";
import type { Db } from "./types";

/**
 * Postgres in-process (PGlite), with the real migrations applied. For tests
 * and for end-to-end test mode only, so neither ever touches Supabase.
 *
 * Loaded on demand: PGlite is a dev dependency and is never part of a
 * production run.
 */
export async function createPgliteDb(): Promise<{ db: Db; close: () => Promise<void> }> {
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");

  const client = new PGlite();
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
  return { db: db as unknown as Db, close: () => client.close() };
}
