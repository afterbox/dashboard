import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { personCreateSchema, personUpdateSchema } from "@/lib/schemas";
import { gift, person } from "@/server/db/schema";
import type { Db } from "@/server/db/types";
import { AppError } from "@/server/errors";
import { createGift } from "@/server/services/gifts";
import { createPerson, deletePerson, getPerson, listPeople, updatePerson } from "@/server/services/people";
import { addUser, fakeStore, testDb } from "./helpers";

let db: Db;
let close: () => Promise<void>;

beforeAll(async () => {
  ({ db, close } = await testDb());
});
afterAll(() => close());

const refusal = async (promise: Promise<unknown>) => {
  const error = await promise.then(
    () => null,
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(AppError);
  return error as AppError;
};

describe("people", () => {
  it("adds someone with just a name and how they're related", async () => {
    const dad = await addUser(db);
    const mary = await createPerson(db, dad.id, { name: "Mary", relationship: "daughter" });
    expect(mary).toMatchObject({ name: "Mary", relationship: "daughter", email: null, phone: null, birthday: null });
    expect(await listPeople(db, dad.id)).toEqual([mary]);
  });

  it("checks what it is given", () => {
    expect(personCreateSchema.safeParse({ name: "  ", relationship: "daughter" }).success).toBe(false);
    expect(personCreateSchema.safeParse({ name: "Mary", relationship: "beneficiary" }).success).toBe(false);
    expect(personCreateSchema.safeParse({ name: "Mary", relationship: "daughter", email: "not-an-email" }).success).toBe(
      false,
    );
    // Left empty means "not yet", not an error.
    expect(personUpdateSchema.parse({ email: "", phone: " " })).toEqual({ email: null, phone: null });
  });

  describe("the free plan: one person", () => {
    it("answers a second person with a clear upgrade response, not a failure", async () => {
      const dad = await addUser(db);
      await createPerson(db, dad.id, { name: "Mary", relationship: "daughter" });

      const error = await refusal(createPerson(db, dad.id, { name: "Tom", relationship: "son" }));
      expect(error.code).toBe("upgrade_required");
      expect(error.status).toBe(402);
      expect(error.message).toMatch(/free plan is for one person/);

      // Nothing was added, and nothing was taken away.
      expect((await listPeople(db, dad.id)).map((p) => p.name)).toEqual(["Mary"]);
    });

    it("holds when two requests arrive at once", async () => {
      const dad = await addUser(db);
      const results = await Promise.allSettled([
        createPerson(db, dad.id, { name: "Mary", relationship: "daughter" }),
        createPerson(db, dad.id, { name: "Tom", relationship: "son" }),
      ]);
      expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
      expect(await listPeople(db, dad.id)).toHaveLength(1);
    });

    it("lets them add someone again after removing the first", async () => {
      const dad = await addUser(db);
      const mary = await createPerson(db, dad.id, { name: "Mary", relationship: "daughter" });
      await deletePerson(db, dad.id, mary.id);
      await expect(createPerson(db, dad.id, { name: "Tom", relationship: "son" })).resolves.toMatchObject({
        name: "Tom",
      });
    });

    it("never removes anything because of the plan: people and messages over the limit are kept", async () => {
      // They can end up with more than the plan lets them add (a guest's work joining an account).
      const dad = await addUser(db);
      const store = fakeStore();
      const [mary, tom] = await db
        .insert(person)
        .values([
          { ownerId: dad.id, name: "Mary", relationship: "daughter" },
          { ownerId: dad.id, name: "Tom", relationship: "son" },
        ])
        .returning();
      await createGift(db, store, dad.id, {
        kind: "letter",
        personId: tom.id,
        envelopeTitle: "For Tom",
        letterText: "Proud of you.",
      });

      // Adding a third is still the offer…
      expect((await refusal(createPerson(db, dad.id, { name: "Sam", relationship: "friend" }))).code).toBe(
        "upgrade_required",
      );
      // …but everyone already there stays, can still be changed, and keeps their messages.
      expect(await listPeople(db, dad.id)).toHaveLength(2);
      await expect(updatePerson(db, dad.id, tom.id, { email: "tom@example.com" })).resolves.toMatchObject({
        email: "tom@example.com",
      });
      await expect(
        createGift(db, store, dad.id, {
          kind: "letter",
          personId: mary.id,
          envelopeTitle: "For Mary",
          letterText: "Still here.",
        }),
      ).resolves.toMatchObject({ kind: "letter" });
      expect(await db.select().from(gift).where(eq(gift.ownerId, dad.id))).toHaveLength(2);
    });
  });

  describe("ownership", () => {
    it("someone else can't read, change or remove a person", async () => {
      const dad = await addUser(db);
      const stranger = await addUser(db);
      const mary = await createPerson(db, dad.id, { name: "Mary", relationship: "daughter" });

      expect(await listPeople(db, stranger.id)).toEqual([]);
      for (const attempt of [
        getPerson(db, stranger.id, mary.id),
        updatePerson(db, stranger.id, mary.id, { name: "Changed" }),
        deletePerson(db, stranger.id, mary.id),
      ]) {
        const error = await refusal(attempt);
        // The same answer as if she didn't exist.
        expect(error.code).toBe("not_found");
        expect(error.status).toBe(404);
      }

      expect(await getPerson(db, dad.id, mary.id)).toMatchObject({ name: "Mary" });
    });
  });

  it("updates only what was sent, and clears what was sent empty", async () => {
    const dad = await addUser(db);
    const mary = await createPerson(db, dad.id, {
      name: "Mary",
      relationship: "daughter",
      email: "mary@example.com",
      birthday: "1994-06-21",
    });
    const renamed = await updatePerson(db, dad.id, mary.id, { name: "Mary Rose" });
    expect(renamed).toMatchObject({ name: "Mary Rose", email: "mary@example.com", birthday: "1994-06-21" });

    const cleared = await updatePerson(db, dad.id, mary.id, personUpdateSchema.parse({ email: "" }));
    expect(cleared).toMatchObject({ name: "Mary Rose", email: null, birthday: "1994-06-21" });
  });

  it("removing someone removes the gifts made for them, and says which recordings to remove", async () => {
    const dad = await addUser(db);
    const store = fakeStore();
    const mary = await createPerson(db, dad.id, { name: "Mary", relationship: "daughter" });
    const path = `${dad.id}/${crypto.randomUUID()}.webm`;
    store.put(path);
    await createGift(db, store, dad.id, {
      kind: "voice",
      personId: mary.id,
      envelopeTitle: "For Mary",
      storagePath: path,
      durationSeconds: 30,
    });
    await createGift(db, store, dad.id, {
      kind: "letter",
      personId: mary.id,
      envelopeTitle: "For Mary, later",
      letterText: "Hello.",
    });

    const { storagePaths } = await deletePerson(db, dad.id, mary.id);
    expect(storagePaths).toEqual([path]);
    expect(await db.select().from(gift).where(eq(gift.ownerId, dad.id))).toEqual([]);
  });
});
