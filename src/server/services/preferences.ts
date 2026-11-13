import { eq } from "drizzle-orm";
import { defaultPreference, type Preference, type PreferenceUpdate } from "@/lib/schemas";
import { preference } from "../db/schema";
import type { Db } from "../db/types";

/** Theme (light, dark or system) and whether to send gentle reminder emails. */

export async function getPreference(db: Db, userId: string): Promise<Preference> {
  const [row] = await db
    .select({ theme: preference.theme, reminderEmails: preference.reminderEmails })
    .from(preference)
    .where(eq(preference.userId, userId));
  return row ?? defaultPreference;
}

/** Change one or both. Whatever isn't sent stays as it was. */
export async function updatePreference(db: Db, userId: string, input: PreferenceUpdate): Promise<Preference> {
  const changes = Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined));
  const [row] = await db
    .insert(preference)
    .values({ userId, ...defaultPreference, ...changes })
    .onConflictDoUpdate({ target: preference.userId, set: { ...changes, updatedAt: new Date() } })
    .returning({ theme: preference.theme, reminderEmails: preference.reminderEmails });
  return row;
}
