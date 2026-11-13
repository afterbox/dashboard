import { eq } from "drizzle-orm";
import { stepIndex } from "@/lib/onboarding";
import { gift, onboardingProgress, person, planInterest, practicalItem, preference } from "../db/schema";
import type { Db } from "../db/types";

/**
 * A guest becomes a real account ("Let's keep this safe for Mary").
 *
 * Everything the guest made moves to the account, in one transaction: either
 * all of it moves or none of it does. Better Auth calls this from
 * `onLinkAccount` and only then removes the guest (src/server/auth.ts).
 *
 * If the email already had an account (they had started before, on another
 * device), the guest's work joins what is there. Nothing is dropped because of
 * the plan: someone may end up with more people than the free plan lets them
 * add, and keeps them all.
 *
 * Recordings don't move: a recording's path is an opaque key, and who owns it
 * is the `gift` row (src/server/services/gifts.ts).
 */
export async function moveGuestData(db: Db, guestId: string, accountId: string) {
  if (guestId === accountId) return;

  await db.transaction(async (tx) => {
    // What they made: always moves.
    await tx.update(person).set({ ownerId: accountId }).where(eq(person.ownerId, guestId));
    await tx.update(gift).set({ ownerId: accountId }).where(eq(gift.ownerId, guestId));
    await tx.update(practicalItem).set({ ownerId: accountId }).where(eq(practicalItem.ownerId, guestId));
    await tx.update(planInterest).set({ userId: accountId }).where(eq(planInterest.userId, guestId));

    // Progress: one row per account. Keep whichever is further on.
    const [guestProgress] = await tx.select().from(onboardingProgress).where(eq(onboardingProgress.userId, guestId));
    if (guestProgress) {
      const [existing] = await tx.select().from(onboardingProgress).where(eq(onboardingProgress.userId, accountId));
      await tx.delete(onboardingProgress).where(eq(onboardingProgress.userId, guestId));

      if (!existing) {
        await tx.insert(onboardingProgress).values({ ...guestProgress, userId: accountId, updatedAt: new Date() });
      } else if (!existing.completedAt && stepIndex(guestProgress.currentStep) > stepIndex(existing.currentStep)) {
        await tx
          .update(onboardingProgress)
          .set({
            currentStep: guestProgress.currentStep,
            data: { ...existing.data, ...guestProgress.data },
            updatedAt: new Date(),
          })
          .where(eq(onboardingProgress.userId, accountId));
      }
      // Otherwise the account had finished, or was further on: what it has stands.
    }

    // Preferences: the account's own win; a guest's are only used if it had none.
    const [guestPreference] = await tx.select().from(preference).where(eq(preference.userId, guestId));
    if (guestPreference) {
      await tx.delete(preference).where(eq(preference.userId, guestId));
      await tx
        .insert(preference)
        .values({ ...guestPreference, userId: accountId, updatedAt: new Date() })
        .onConflictDoNothing({ target: preference.userId });
    }
  });
}
