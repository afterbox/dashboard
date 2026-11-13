import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  planChoiceSchema,
  practicalItemCreateSchema,
  preferenceUpdateSchema,
  defaultPreference,
} from "@/lib/schemas";
import { planInterest, practicalItem } from "@/server/db/schema";
import type { Db } from "@/server/db/types";
import { AppError } from "@/server/errors";
import { createPerson, listPeople } from "@/server/services/people";
import { getPlan, latestPlanChoice, recordPlanChoice } from "@/server/services/plan";
import { createPracticalItem, deletePracticalItem, listPracticalItems } from "@/server/services/practical";
import { getPreference, updatePreference } from "@/server/services/preferences";
import { parseInput } from "@/server/validate";
import { addUser, testDb } from "./helpers";

let db: Db;
let close: () => Promise<void>;

beforeAll(async () => {
  ({ db, close } = await testDb());
});
afterAll(() => close());

const refused = (fn: () => unknown) => {
  try {
    fn();
  } catch (error) {
    expect(error).toBeInstanceOf(AppError);
    return error as AppError;
  }
  throw new Error("Expected it to be refused.");
};

describe("what they'll need to find", () => {
  it("keeps the name of a bank, and a note about where things are", async () => {
    const dad = await addUser(db);
    const item = await createPracticalItem(
      db,
      dad.id,
      parseInput(practicalItemCreateSchema, {
        category: "bank",
        providerName: "Monzo",
        note: "Joint account with Sam. Statements are in the blue folder.",
      }),
    );
    expect(item).toMatchObject({ category: "bank", providerName: "Monzo" });
    expect(await listPracticalItems(db, dad.id)).toEqual([item]);
  });

  it.each([
    ["an account number", { category: "bank", providerName: "Monzo 12345678" }],
    ["a sort code", { category: "bank", providerName: "Monzo 04-00-04" }],
    ["a card number", { category: "bank", providerName: "Visa 4242 4242 4242 4242" }],
    ["a PIN in the note", { category: "bank", providerName: "Monzo", note: "PIN 2468" }],
    ["a password in the note", { category: "crypto", providerName: "Ledger", note: "password: hunter2" }],
    ["a seed phrase in the note", { category: "crypto", providerName: "Ledger", note: "seed phrase: apple river stone" }],
  ])("refuses %s before anything is stored, and doesn't repeat it back", async (_what, input) => {
    const dad = await addUser(db);
    const error = refused(() => parseInput(practicalItemCreateSchema, input));
    expect(error.code).toBe("invalid_input");
    expect(error.status).toBe(400);
    expect(error.message).toMatch(/Just the name is enough/);
    // What they typed is never echoed in the error.
    const said = JSON.stringify({ message: error.message, fields: error.fields });
    for (const secret of ["12345678", "04-00-04", "4242", "2468", "hunter2", "apple river stone"]) {
      expect(said).not.toContain(secret);
    }
    expect(await db.select().from(practicalItem).where(eq(practicalItem.ownerId, dad.id))).toEqual([]);
  });

  it("someone else can't see or remove an item", async () => {
    const dad = await addUser(db);
    const stranger = await addUser(db);
    const item = await createPracticalItem(db, dad.id, { category: "pension", providerName: "Aviva" });

    expect(await listPracticalItems(db, stranger.id)).toEqual([]);
    await expect(deletePracticalItem(db, stranger.id, item.id)).rejects.toMatchObject({ code: "not_found" });
    expect(await listPracticalItems(db, dad.id)).toEqual([item]);

    await deletePracticalItem(db, dad.id, item.id);
    expect(await listPracticalItems(db, dad.id)).toEqual([]);
  });

  it("isn't limited by the plan", async () => {
    const dad = await addUser(db);
    for (const providerName of ["Monzo", "Aviva", "Nationwide"]) {
      await createPracticalItem(db, dad.id, { category: "other", providerName });
    }
    expect(await listPracticalItems(db, dad.id)).toHaveLength(3);
  });
});

describe("preferences", () => {
  it("defaults to the system theme, with reminders on", async () => {
    const dad = await addUser(db);
    expect(await getPreference(db, dad.id)).toEqual({ theme: "system", reminderEmails: true });
    expect(defaultPreference.theme).toBe("system");
  });

  it("remembers the theme", async () => {
    const dad = await addUser(db);
    expect(await updatePreference(db, dad.id, { theme: "dark" })).toEqual({ theme: "dark", reminderEmails: true });
    expect(await getPreference(db, dad.id)).toEqual({ theme: "dark", reminderEmails: true });

    // Changing one leaves the other as it was.
    expect(await updatePreference(db, dad.id, { reminderEmails: false })).toEqual({
      theme: "dark",
      reminderEmails: false,
    });
    expect(await updatePreference(db, dad.id, { theme: "light" })).toEqual({ theme: "light", reminderEmails: false });
    expect(await updatePreference(db, dad.id, { theme: "system" })).toEqual({
      theme: "system",
      reminderEmails: false,
    });
  });

  it("only knows light, dark and system", () => {
    expect(preferenceUpdateSchema.safeParse({ theme: "sepia" }).success).toBe(false);
    expect(preferenceUpdateSchema.safeParse({}).success).toBe(false);
    expect(preferenceUpdateSchema.safeParse({ reminderEmails: "yes" }).success).toBe(false);
    for (const theme of ["light", "dark", "system"]) {
      expect(preferenceUpdateSchema.safeParse({ theme }).success).toBe(true);
    }
  });

  it("keeps each person's preferences apart", async () => {
    const one = await addUser(db);
    const two = await addUser(db);
    await updatePreference(db, one.id, { theme: "dark" });
    expect(await getPreference(db, two.id)).toEqual({ theme: "system", reminderEmails: true });
  });
});

describe("the plan", () => {
  it("records the choice on the offer", async () => {
    const dad = await addUser(db);
    expect(await latestPlanChoice(db, dad.id)).toBeNull();

    const recorded = await recordPlanChoice(db, dad.id, "free");
    expect(recorded.choice).toBe("free");
    expect(await latestPlanChoice(db, dad.id)).toBe("free");
  });

  it("keeps every choice, and reads the latest", async () => {
    const dad = await addUser(db);
    await recordPlanChoice(db, dad.id, "free");
    await new Promise((resolve) => setTimeout(resolve, 5));
    await recordPlanChoice(db, dad.id, "paid_interest");

    const rows = await db.select().from(planInterest).where(eq(planInterest.userId, dad.id));
    expect(rows.map((r) => r.choice).sort()).toEqual(["free", "paid_interest"]);
    expect(await latestPlanChoice(db, dad.id)).toBe("paid_interest");
  });

  it("only knows the two choices", () => {
    expect(planChoiceSchema.safeParse({ choice: "free" }).success).toBe(true);
    expect(planChoiceSchema.safeParse({ choice: "paid_interest" }).success).toBe(true);
    expect(planChoiceSchema.safeParse({ choice: "paid" }).success).toBe(false);
    expect(planChoiceSchema.safeParse({}).success).toBe(false);
  });

  it("takes no payment and changes no limits yet: interest in the paid plan is only recorded", async () => {
    const dad = await addUser(db);
    await createPerson(db, dad.id, { name: "Mary", relationship: "daughter" });
    await recordPlanChoice(db, dad.id, "paid_interest");

    expect(getPlan()).toBe("free");
    await expect(createPerson(db, dad.id, { name: "Tom", relationship: "son" })).rejects.toMatchObject({
      code: "upgrade_required",
    });
    expect(await listPeople(db, dad.id)).toHaveLength(1);
  });
});
