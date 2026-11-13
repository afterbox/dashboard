import { and, asc, eq } from "drizzle-orm";
import type { PracticalItem, PracticalItemCreate } from "@/lib/schemas";
import { practicalItem } from "../db/schema";
import type { Db } from "../db/types";
import { notFound } from "../errors";

/**
 * "What they'll need to find": where things are, never the keys to them.
 *
 * The no-numbers rule (src/lib/no-numbers.ts) is part of the input schema, so
 * by the time anything reaches here it has already been checked. Every function
 * takes the signed-in user's id first.
 */

type Row = typeof practicalItem.$inferSelect;

export const toPracticalItem = (row: Row): PracticalItem => ({
  id: row.id,
  category: row.category,
  providerName: row.providerName,
  note: row.note,
  createdAt: row.createdAt.toISOString(),
});

export async function listPracticalItems(db: Db, userId: string): Promise<PracticalItem[]> {
  const rows = await db
    .select()
    .from(practicalItem)
    .where(eq(practicalItem.ownerId, userId))
    .orderBy(asc(practicalItem.createdAt));
  return rows.map(toPracticalItem);
}

export async function createPracticalItem(db: Db, userId: string, input: PracticalItemCreate): Promise<PracticalItem> {
  const [row] = await db
    .insert(practicalItem)
    .values({ ownerId: userId, category: input.category, providerName: input.providerName, note: input.note ?? null })
    .returning();
  return toPracticalItem(row);
}

export async function deletePracticalItem(db: Db, userId: string, itemId: string) {
  const [row] = await db
    .delete(practicalItem)
    .where(and(eq(practicalItem.id, itemId), eq(practicalItem.ownerId, userId)))
    .returning({ id: practicalItem.id });
  if (!row) throw notFound("that");
}
