/**
 * Runs once when the server starts: check the environment, so a missing
 * variable is a clear error at startup rather than a surprise on someone's
 * first request. Names and reasons only; never a value.
 *
 * In development it also opens the database connection now, so the first
 * request doesn't wait for it.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { env } = await import("./server/env");
  const { production, testMode } = env();
  if (production || testMode) return;
  const { getDb } = await import("./server/db");
  const { sql } = await import("drizzle-orm");
  void getDb()
    .then((db) => db.execute(sql`select 1`))
    .catch(() => {
      // The first request will try again, and say why if it can't.
    });
}
