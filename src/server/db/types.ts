import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import type * as schema from "./schema";

/**
 * The database as the services see it: Drizzle over Postgres, whichever driver
 * is underneath (postgres.js against Supabase; PGlite in tests). A transaction
 * is one of these too, so a service can be given either.
 */
export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;
