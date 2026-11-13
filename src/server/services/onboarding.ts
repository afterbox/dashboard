import { and, asc, eq } from "drizzle-orm";
import {
  firstStep,
  isStep,
  lastStep,
  nextStep,
  offerInOnboarding,
  shownStep,
  reachedStep,
  signUpStep,
  stepIndex,
  type Step,
  type Visitor,
} from "@/lib/onboarding";
import { stepInputs, type OnboardingState } from "@/lib/schemas";
import type { z } from "zod";
import { gift, onboardingProgress, person, practicalItem, type OnboardingData } from "../db/schema";
import type { Db } from "../db/types";
import { AppError } from "../errors";
import type { RecordingStore } from "../storage";
import { parseInput } from "../validate";
import { createGift, toGift } from "./gifts";
import { createPerson, toPerson, updatePerson } from "./people";
import { latestPlanChoice, recordPlanChoice } from "./plan";
import { createPracticalItem, toPracticalItem } from "./practical";
import { getPreference, updatePreference } from "./preferences";

/**
 * Onboarding: where someone is, and saving each step as they go
 * (docs/onboarding-story.md).
 *
 * Saving a step does that step's work and moves them on, in one transaction.
 * It is idempotent: each step remembers the id of what it made, so saving it
 * again (a retry, or going back to change a name) changes that rather than
 * making another.
 */

/** Whoever is signed in, guest or not. */
export type SessionUser = { id: string; isAnonymous: boolean; email?: string | null; name?: string | null };

export type Progress = { currentStep: Step; data: OnboardingData; completed: boolean };

const notStarted: Progress = { currentStep: firstStep, data: {}, completed: false };

const toProgress = (row: typeof onboardingProgress.$inferSelect): Progress => ({
  currentStep: shownStep(row.currentStep),
  data: row.data,
  completed: row.completedAt !== null,
});

export async function getProgress(db: Db, userId: string): Promise<Progress> {
  const [row] = await db.select().from(onboardingProgress).where(eq(onboardingProgress.userId, userId));
  return row ? toProgress(row) : notStarted;
}

/** What the routing guard needs: who is asking, and how far they have got. */
export async function getVisitor(db: Db, user: SessionUser | null): Promise<Visitor> {
  if (!user) return { kind: "none" };
  const { currentStep, completed } = await getProgress(db, user.id);
  return { kind: user.isAnonymous ? "guest" : "member", currentStep, completed };
}

const visitorOf = (user: SessionUser, progress: Progress): Visitor => ({
  kind: user.isAnonymous ? "guest" : "member",
  currentStep: progress.currentStep,
  completed: progress.completed,
});

const notReached = () =>
  new AppError("step_not_reached", "Let's finish the step before this one first.");
const signUpRequired = () =>
  new AppError("sign_up_required", "Let's keep this safe first: add your email to carry on.");

/** The person onboarding is about: the one the "someone" step made, if they are still there. */
async function onboardingPerson(db: Db, userId: string, data: OnboardingData) {
  const personId = data.someone?.personId;
  if (!personId) return null;
  const [row] = await db
    .select()
    .from(person)
    .where(and(eq(person.id, personId), eq(person.ownerId, userId)));
  return row ?? null;
}

type StepInput<S extends Step> = z.output<(typeof stepInputs)[S]>;

/**
 * Save one step. `input` is whatever that screen sent; it is checked against
 * the step's own schema here.
 */
export async function saveStep(
  db: Db,
  store: RecordingStore,
  user: SessionUser,
  step: Step,
  input: unknown,
): Promise<Progress> {
  const parsed = parseInput(stepInputs[step], input ?? {});

  return db.transaction(async (tx) => {
    // Their progress row, made on the first save, and held for this
    // transaction: an upsert that changes nothing still locks the row, in one trip.
    const [row] = await tx
      .insert(onboardingProgress)
      .values({ userId: user.id, currentStep: firstStep })
      .onConflictDoUpdate({ target: onboardingProgress.userId, set: { userId: user.id } })
      .returning();
    const progress = toProgress(row);

    // Finished: there is nothing left to save. (Changes are made in /home from here on.)
    if (progress.completed) return progress;

    // In order. Going back to change an earlier step is fine; skipping ahead isn't, nor is a step that isn't shown.
    const reached = reachedStep(visitorOf(user, progress));
    if (!isStep(step) || stepIndex(step) > stepIndex(reached)) throw notReached();

    const data: OnboardingData = { ...progress.data };

    switch (step) {
      case "someone": {
        const { name, relationship } = parsed as StepInput<"someone">;
        // The person this step made before, or one they already have (an account that began elsewhere).
        const existing =
          (await onboardingPerson(tx, user.id, data)) ??
          (await tx.select().from(person).where(eq(person.ownerId, user.id)).orderBy(asc(person.createdAt)).limit(1))[0];
        const saved = existing
          ? await updatePerson(tx, user.id, existing.id, { name, relationship })
          : await createPerson(tx, user.id, { name, relationship });
        data.someone = { personId: saved.id };
        break;
      }

      case "message": {
        const message = parsed as StepInput<"message">;
        const forPerson = await onboardingPerson(tx, user.id, data);
        if (!forPerson) throw notReached();
        // Sealing it again (record again, or a letter instead) takes the place of the first.
        const previous = data.message?.giftId;
        const [stillThere] = previous
          ? await tx
              .select({ id: gift.id })
              .from(gift)
              .where(and(eq(gift.id, previous), eq(gift.ownerId, user.id)))
          : [];
        const sealed = await createGift(tx, store, user.id, {
          ...message,
          personId: forPerson.id,
          replaces: stillThere?.id,
        });
        data.message = { giftId: sealed.id };
        break;
      }

      case "keep-safe":
        if (user.isAnonymous) throw signUpRequired();
        break;

      case "reach": {
        const { email, phone } = parsed as StepInput<"reach">;
        const forPerson = await onboardingPerson(tx, user.id, data);
        if (!forPerson) throw notReached();
        // "Add later" sends nothing, and changes nothing.
        if (email !== undefined || phone !== undefined) {
          await updatePerson(tx, user.id, forPerson.id, { email, phone });
        }
        data.reach = { later: !email && !phone };
        break;
      }

      case "find": {
        const { providerName } = parsed as StepInput<"find">;
        const previous = data.find?.practicalItemId ?? null;
        if (!providerName) {
          // "Skip for now". Anything added before stays.
          data.find = { practicalItemId: previous };
          break;
        }
        const [renamed] = previous
          ? await tx
              .update(practicalItem)
              .set({ providerName })
              .where(and(eq(practicalItem.id, previous), eq(practicalItem.ownerId, user.id)))
              .returning({ id: practicalItem.id })
          : [];
        const itemId = renamed?.id ?? (await createPracticalItem(tx, user.id, { category: "bank", providerName })).id;
        data.find = { practicalItemId: itemId };
        break;
      }

      case "nudges": {
        const { reminderEmails } = parsed as StepInput<"nudges">;
        await updatePreference(tx, user.id, { reminderEmails });
        data.nudges = { reminderEmails };
        break;
      }

      case "everyone": {
        const { choice } = parsed as StepInput<"everyone">;
        await recordPlanChoice(tx, user.id, choice);
        data.everyone = { choice };
        break;
      }
    }

    // Move on, if this was the step they were on. Someone signed in never stops at sign-up.
    let currentStep = reached;
    if (step === reached) {
      let next = nextStep(step);
      if (next === signUpStep && !user.isAnonymous) next = nextStep(next);
      currentStep = next ?? step;
    }

    const [saved] = await tx
      .update(onboardingProgress)
      .set({ currentStep, data, updatedAt: new Date() })
      .where(eq(onboardingProgress.userId, user.id))
      .returning();
    return toProgress(saved);
  });
}

/**
 * The end of onboarding: a real account, someone they love, a sealed message
 * for them, every step reached, and a choice made on the offer (free, while
 * the offer isn't part of onboarding). Safe to call again.
 */
export async function completeOnboarding(db: Db, user: SessionUser): Promise<Progress> {
  if (user.isAnonymous) throw signUpRequired();

  return db.transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(onboardingProgress)
      .where(eq(onboardingProgress.userId, user.id))
      .for("update");
    if (!row) throw notReached();
    if (row.completedAt) return toProgress(row);

    const data: OnboardingData = { ...row.data };
    if (!data.someone || !data.message || shownStep(row.currentStep) !== lastStep) throw notReached();
    if (!data.everyone) {
      // Without the offer in onboarding, they carry on free. It can be chosen later in /home.
      if (offerInOnboarding) throw notReached();
      await recordPlanChoice(tx, user.id, "free");
      data.everyone = { choice: "free" };
    }

    const [saved] = await tx
      .update(onboardingProgress)
      .set({ data, completedAt: new Date(), updatedAt: new Date() })
      .where(eq(onboardingProgress.userId, user.id))
      .returning();
    return toProgress(saved);
  });
}

/** Everything the onboarding screens need, so a refresh shows exactly what was there before. */
export async function getOnboardingState(
  db: Db,
  user: SessionUser | null,
  googleEnabled: boolean,
  /** Their progress, if it has just been saved: no need to read it again. */
  known?: Progress,
): Promise<OnboardingState> {
  if (!user) {
    return {
      user: null,
      currentStep: firstStep,
      completed: false,
      person: null,
      gift: null,
      bank: null,
      preference: await getPreferenceFor(db, null),
      planChoice: null,
      googleEnabled,
    };
  }

  const progress = known ?? (await getProgress(db, user.id));
  const giftId = progress.data.message?.giftId;
  const bankId = progress.data.find?.practicalItemId;

  // None of these depend on another: ask for them together.
  const [forPerson, [sealed], [bank], preference, planChoice] = await Promise.all([
    onboardingPerson(db, user.id, progress.data),
    giftId ? db.select().from(gift).where(and(eq(gift.id, giftId), eq(gift.ownerId, user.id))) : [],
    bankId
      ? db
          .select()
          .from(practicalItem)
          .where(and(eq(practicalItem.id, bankId), eq(practicalItem.ownerId, user.id)))
      : [],
    getPreferenceFor(db, user.id),
    latestPlanChoice(db, user.id),
  ]);

  return {
    user: {
      isGuest: user.isAnonymous,
      email: user.isAnonymous ? null : (user.email ?? null),
      // A guest has no name of their own (Better Auth gives every guest the same stand-in).
      name: user.isAnonymous ? null : user.name?.trim() || null,
    },
    currentStep: reachedStep(visitorOf(user, progress)),
    completed: progress.completed,
    person: forPerson ? toPerson(forPerson) : null,
    gift: sealed ? toGift(sealed) : null,
    bank: bank ? toPracticalItem(bank) : null,
    preference,
    planChoice,
    googleEnabled,
  };
}

const getPreferenceFor = async (db: Db, userId: string | null) =>
  userId ? getPreference(db, userId) : { theme: "system" as const, reminderEmails: true };
