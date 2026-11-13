import { and, asc, count, eq, isNotNull } from "drizzle-orm";
import type { Person, PersonCreate, PersonUpdate } from "@/lib/schemas";
import { gift, person, user } from "../db/schema";
import type { Db } from "../db/types";
import { notFound, upgradeRequired } from "../errors";
import { getPlan, plans } from "./plan";

/**
 * The people they love. Every function takes the signed-in user's id first and
 * never reads or changes a row without it.
 */

type Row = typeof person.$inferSelect;

export const toPerson = (row: Row): Person => ({
  id: row.id,
  name: row.name,
  relationship: row.relationship,
  email: row.email,
  phone: row.phone,
  birthday: row.birthday,
  createdAt: row.createdAt.toISOString(),
});

/** Oldest first: the first person they thought of stays first. */
export async function listPeople(db: Db, userId: string): Promise<Person[]> {
  const rows = await db.select().from(person).where(eq(person.ownerId, userId)).orderBy(asc(person.createdAt));
  return rows.map(toPerson);
}

export async function getPerson(db: Db, userId: string, personId: string): Promise<Person> {
  const [row] = await db
    .select()
    .from(person)
    .where(and(eq(person.id, personId), eq(person.ownerId, userId)));
  if (!row) throw notFound("that person");
  return toPerson(row);
}

/**
 * Add someone. On the free plan a second person is answered with
 * `upgrade_required`, which the UI turns into the offer.
 */
export async function createPerson(db: Db, userId: string, input: PersonCreate): Promise<Person> {
  return db.transaction(async (tx) => {
    // Hold their user row, so two requests at once can't both slip under the limit.
    await tx.select({ id: user.id }).from(user).where(eq(user.id, userId)).for("update");

    const limit = plans[getPlan()].people;
    const [{ total }] = await tx.select({ total: count() }).from(person).where(eq(person.ownerId, userId));
    if (total >= limit) throw upgradeRequired();

    const [row] = await tx
      .insert(person)
      .values({
        ownerId: userId,
        name: input.name,
        relationship: input.relationship,
        email: input.email ?? null,
        phone: input.phone ?? null,
        birthday: input.birthday ?? null,
      })
      .returning();
    return toPerson(row);
  });
}

export async function updatePerson(db: Db, userId: string, personId: string, input: PersonUpdate): Promise<Person> {
  // Only what was sent: a field left out stays as it is; null clears it.
  const changes = Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined));
  const [row] = await db
    .update(person)
    .set({ ...changes, updatedAt: new Date() })
    .where(and(eq(person.id, personId), eq(person.ownerId, userId)))
    .returning();
  if (!row) throw notFound("that person");
  return toPerson(row);
}

/**
 * Remove someone, and the gifts made for them. Returns where their recordings
 * are stored, so the caller can remove the files too.
 */
export async function deletePerson(db: Db, userId: string, personId: string): Promise<{ storagePaths: string[] }> {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .select({ id: person.id })
      .from(person)
      .where(and(eq(person.id, personId), eq(person.ownerId, userId)))
      .for("update");
    if (!row) throw notFound("that person");

    const recordings = await tx
      .select({ storagePath: gift.storagePath })
      .from(gift)
      .where(and(eq(gift.personId, personId), eq(gift.ownerId, userId), isNotNull(gift.storagePath)));

    // Their gifts go with them (the foreign key cascades).
    await tx.delete(person).where(and(eq(person.id, personId), eq(person.ownerId, userId)));
    return { storagePaths: recordings.map((r) => r.storagePath as string) };
  });
}
