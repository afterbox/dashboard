import { desc, eq } from "drizzle-orm";
import type { PlanChoice } from "@/lib/schemas";
import { planInterest } from "../db/schema";
import type { Db } from "../db/types";

/**
 * Plans. There are no payments yet, so everyone is on the free plan; choosing
 * the paid one records interest and saves their place.
 *
 * The plan only ever limits what can be *added*. Nothing already made is
 * removed or held back because of it: a sealed message is always kept and
 * always delivered.
 */
export const plans = {
  free: { people: 1 },
  paid: { people: Infinity },
} as const;

export type Plan = keyof typeof plans;

/** The plan someone is on. Free for everyone until payments exist; then this reads it from their account. */
export const getPlan = (): Plan => "free";

export async function recordPlanChoice(db: Db, userId: string, choice: PlanChoice) {
  const [row] = await db.insert(planInterest).values({ userId, choice }).returning();
  return { choice: row.choice, createdAt: row.createdAt.toISOString() };
}

/** Their most recent choice on the offer, or null if they haven't seen it. */
export async function latestPlanChoice(db: Db, userId: string): Promise<PlanChoice | null> {
  const [row] = await db
    .select({ choice: planInterest.choice })
    .from(planInterest)
    .where(eq(planInterest.userId, userId))
    .orderBy(desc(planInterest.createdAt))
    .limit(1);
  return row?.choice ?? null;
}
