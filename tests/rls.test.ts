import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { getTableName, is, sql } from "drizzle-orm";
import { PgTable } from "drizzle-orm/pg-core";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as schema from "@/server/db/schema";
import type { Db } from "@/server/db/types";
import { query, testDb } from "./helpers";

/**
 * Supabase exposes every table in `public` through its Data API. Row Level
 * Security with no policies means the public keys can read and write nothing;
 * the app itself connects as the database owner. These tests fail the moment a
 * table is added without it.
 */

const tables = (Object.values(schema) as unknown[])
  .filter((value): value is PgTable => is(value, PgTable))
  .map((table) => getTableName(table))
  .sort();

let db: Db;
let close: () => Promise<void>;

beforeAll(async () => {
  ({ db, close } = await testDb());
});
afterAll(() => close());

describe("row level security", () => {
  it("the schema has the tables we expect", () => {
    expect(tables).toEqual([
      "account",
      "gift",
      "onboarding_progress",
      "person",
      "plan_interest",
      "practical_item",
      "preference",
      "rate_limit",
      "session",
      "throttle",
      "user",
      "verification",
    ]);
  });

  it("a committed migration enables it on every table", () => {
    const folder = path.join(process.cwd(), "drizzle");
    const migrations = readdirSync(folder)
      .filter((file) => file.endsWith(".sql"))
      .map((file) => readFileSync(path.join(folder, file), "utf8"))
      .join("\n");
    for (const table of tables) {
      expect(migrations, `${table} has no ENABLE ROW LEVEL SECURITY`).toContain(
        `ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`,
      );
    }
    expect(migrations).not.toMatch(/DISABLE ROW LEVEL SECURITY/i);
    expect(migrations).not.toMatch(/CREATE POLICY/i);
  });

  it("is on for every table in the migrated database, with none left out", async () => {
    const rows = await query<{ name: string; enabled: boolean }>(
      db,
      sql`
      select c.relname as name, c.relrowsecurity as enabled
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'r'
      order by c.relname
    `,
    );
    expect(rows.map((row) => row.name)).toEqual(tables);
    for (const row of rows) expect(row.enabled, `${row.name} has row level security off`).toBe(true);
  });

  it("has no policies: deny-all for everyone but the owner", async () => {
    const [{ count }] = await query<{ count: number }>(
      db,
      sql`select count(*)::int as count from pg_policies where schemaname = 'public'`,
    );
    expect(count).toBe(0);
  });
});
