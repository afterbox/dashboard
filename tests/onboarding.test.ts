import { eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { redirectFor, reachedStep, steps, type Step, type Visitor } from "@/lib/onboarding";
import { gift, onboardingProgress, person, planInterest, practicalItem, user } from "@/server/db/schema";
import type { Db } from "@/server/db/types";
import { AppError } from "@/server/errors";
import {
  completeOnboarding,
  getOnboardingState,
  getProgress,
  getVisitor,
  saveStep,
  type SessionUser,
} from "@/server/services/onboarding";
import { addUser, fakeStore, testDb, type FakeStore } from "./helpers";

let db: Db;
let close: () => Promise<void>;
let store: FakeStore;

beforeAll(async () => {
  ({ db, close } = await testDb());
});
afterAll(() => close());
beforeEach(() => {
  store = fakeStore();
});

const refusal = async (promise: Promise<unknown>) => {
  const error = await promise.then(
    () => null,
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(AppError);
  return error as AppError;
};

const letter = { kind: "letter", envelopeTitle: "For Mary, on a hard day", letterText: "I'm with you." } as const;

/** The guest becomes a real account, as sign-up does. */
async function signUp(guest: SessionUser): Promise<SessionUser> {
  const email = `${guest.id}@example.com`;
  await db.update(user).set({ isAnonymous: false, email, emailVerified: true }).where(eq(user.id, guest.id));
  return { id: guest.id, isAnonymous: false, email };
}

/** Everything up to sign-up. */
async function untilSignUp(guest: SessionUser) {
  await saveStep(db, store, guest, "someone", { name: "Mary", relationship: "daughter" });
  return saveStep(db, store, guest, "message", letter);
}

describe("onboarding progress", () => {
  it("starts at the first question, with nothing saved", async () => {
    const guest = await addUser(db, { guest: true });
    expect(await getProgress(db, guest.id)).toEqual({ currentStep: "someone", data: {}, completed: false });
    expect(await getOnboardingState(db, null, false)).toMatchObject({ user: null, currentStep: "someone" });
  });

  it("reads a step that no longer exists as the first one", async () => {
    // There was once a welcome screen before the first question.
    const guest = await addUser(db, { guest: true });
    await db.insert(onboardingProgress).values({ userId: guest.id, currentStep: "welcome" as Step });
    expect((await getProgress(db, guest.id)).currentStep).toBe("someone");
    expect(await getVisitor(db, guest)).toMatchObject({ kind: "guest", currentStep: "someone" });
  });

  it("saves each step and moves on to the next", async () => {
    const guest = await addUser(db, { guest: true });

    expect(
      (await saveStep(db, store, guest, "someone", { name: "Mary", relationship: "daughter" })).currentStep,
    ).toBe("message");
    expect((await saveStep(db, store, guest, "message", letter)).currentStep).toBe("keep-safe");

    const member = await signUp(guest);
    // Signed up: the sign-up screen is behind them.
    expect((await getOnboardingState(db, member, false)).currentStep).toBe("reach");
    expect((await saveStep(db, store, member, "reach", { email: "mary@example.com" })).currentStep).toBe("find");
    expect((await saveStep(db, store, member, "find", { providerName: "Monzo" })).currentStep).toBe("nudges");
    expect((await saveStep(db, store, member, "nudges", { reminderEmails: false })).currentStep).toBe("everyone");
    expect((await saveStep(db, store, member, "everyone", { choice: "paid_interest" })).currentStep).toBe("everyone");

    const done = await completeOnboarding(db, member);
    expect(done.completed).toBe(true);

    // Each step did its work.
    const [mary] = await db.select().from(person).where(eq(person.ownerId, member.id));
    expect(mary).toMatchObject({ name: "Mary", relationship: "daughter", email: "mary@example.com" });
    const [sealed] = await db.select().from(gift).where(eq(gift.ownerId, member.id));
    expect(sealed).toMatchObject({ kind: "letter", personId: mary.id, envelopeTitle: "For Mary, on a hard day" });
    const [bank] = await db.select().from(practicalItem).where(eq(practicalItem.ownerId, member.id));
    expect(bank).toMatchObject({ category: "bank", providerName: "Monzo" });
    const choices = await db.select().from(planInterest).where(eq(planInterest.userId, member.id));
    expect(choices.map((c) => c.choice)).toEqual(["paid_interest"]);

    const state = await getOnboardingState(db, member, false);
    expect(state).toMatchObject({
      completed: true,
      user: { isGuest: false, email: member.email },
      person: { name: "Mary" },
      gift: { kind: "letter" },
      bank: { providerName: "Monzo" },
      preference: { theme: "system", reminderEmails: false },
      planChoice: "paid_interest",
    });
  });

  it("resumes exactly where they left off, with what they made", async () => {
    const guest = await addUser(db, { guest: true });
      await saveStep(db, store, guest, "someone", { name: "Mary", relationship: "daughter" });

    // A new request, later: nothing is held in memory between them.
    const state = await getOnboardingState(db, guest, false);
    expect(state.currentStep).toBe("message");
    expect(state.person).toMatchObject({ name: "Mary", relationship: "daughter" });
    expect(state.gift).toBeNull();
    expect(state.user).toEqual({ isGuest: true, email: null, name: null });
    expect(await getVisitor(db, guest)).toEqual({ kind: "guest", currentStep: "message", completed: false });
  });

  it("saving a step again changes what it made; it never makes a second", async () => {
    const guest = await addUser(db, { guest: true });
      await saveStep(db, store, guest, "someone", { name: "Mary", relationship: "daughter" });
    // The same request, sent twice (a retry)…
    await saveStep(db, store, guest, "someone", { name: "Mary", relationship: "daughter" });
    // …and going back to change the name.
    const progress = await saveStep(db, store, guest, "someone", { name: "Mary Rose", relationship: "daughter" });

    const people = await db.select().from(person).where(eq(person.ownerId, guest.id));
    expect(people).toHaveLength(1);
    expect(people[0].name).toBe("Mary Rose");
    // Going back doesn't lose their place.
    expect(progress.currentStep).toBe("message");

    await saveStep(db, store, guest, "message", letter);
    await saveStep(db, store, guest, "message", { ...letter, letterText: "A better version." });
    const gifts = await db.select().from(gift).where(eq(gift.ownerId, guest.id));
    expect(gifts).toHaveLength(1);
    expect(gifts[0].letterText).toBe("A better version.");
    expect((await getProgress(db, guest.id)).currentStep).toBe("keep-safe");
  });

  it("seals a voice note, and recording again replaces it and its file", async () => {
    const guest = await addUser(db, { guest: true });
      await saveStep(db, store, guest, "someone", { name: "Mary", relationship: "daughter" });

    const first = `${guest.id}/${crypto.randomUUID()}.webm`;
    store.put(first);
    const voice = { kind: "voice", envelopeTitle: "For Mary", durationSeconds: 20 } as const;
    await saveStep(db, store, guest, "message", { ...voice, storagePath: first });
    // A retry of the very same save is harmless.
    await saveStep(db, store, guest, "message", { ...voice, storagePath: first });
    expect(store.files.has(first)).toBe(true);

    const second = `${guest.id}/${crypto.randomUUID()}.webm`;
    store.put(second);
    await saveStep(db, store, guest, "message", { ...voice, storagePath: second });

    const gifts = await db.select().from(gift).where(eq(gift.ownerId, guest.id));
    expect(gifts.map((g) => g.storagePath)).toEqual([second]);
    expect(store.files.has(first)).toBe(false);
  });

  it("goes in order: no skipping ahead", async () => {
    const guest = await addUser(db, { guest: true });
    expect((await refusal(saveStep(db, store, guest, "message", letter))).code).toBe("step_not_reached");
      expect((await refusal(saveStep(db, store, guest, "message", letter))).code).toBe("step_not_reached");
    expect(await db.select().from(gift).where(eq(gift.ownerId, guest.id))).toEqual([]);
  });

  it("a guest can't go past sign-up", async () => {
    const guest = await addUser(db, { guest: true });
    await untilSignUp(guest);

    expect((await refusal(saveStep(db, store, guest, "keep-safe", {}))).code).toBe("sign_up_required");
    expect((await refusal(saveStep(db, store, guest, "reach", { email: "mary@example.com" }))).code).toBe(
      "step_not_reached",
    );
    expect((await refusal(completeOnboarding(db, guest))).code).toBe("sign_up_required");
    expect((await getProgress(db, guest.id)).currentStep).toBe("keep-safe");
  });

  it("can't be completed before the gift is made and the offer answered", async () => {
    const member = await addUser(db);
    expect((await refusal(completeOnboarding(db, member))).code).toBe("step_not_reached");
    await saveStep(db, store, member, "someone", { name: "Mary", relationship: "daughter" });
    expect((await refusal(completeOnboarding(db, member))).code).toBe("step_not_reached");
  });

  it("checks each step's input, kindly", async () => {
    const guest = await addUser(db, { guest: true });
      const noName = await refusal(saveStep(db, store, guest, "someone", { name: " ", relationship: "daughter" }));
    expect(noName.code).toBe("invalid_input");
    expect(noName.fields).toEqual({ name: "Tell us their name." });

    const member = await signUp(guest);
    await saveStep(db, store, member, "someone", { name: "Mary", relationship: "daughter" });
    await saveStep(db, store, member, "message", letter);
    await saveStep(db, store, member, "reach", {});

    // "Just the name. Never numbers or passwords."
    const numbers = await refusal(saveStep(db, store, member, "find", { providerName: "Monzo 12345678" }));
    expect(numbers.code).toBe("invalid_input");
    expect(numbers.message).toMatch(/Just the name is enough/);
    expect(await db.select().from(practicalItem).where(eq(practicalItem.ownerId, member.id))).toEqual([]);
    expect((await getProgress(db, member.id)).currentStep).toBe("find");
  });

  it("how to reach them and the bank can both be left for later", async () => {
    const guest = await addUser(db, { guest: true });
    await untilSignUp(guest);
    const member = await signUp(guest);

    const afterReach = await saveStep(db, store, member, "reach", {});
    expect(afterReach.currentStep).toBe("find");
    expect(afterReach.data.reach).toEqual({ later: true });

    const afterFind = await saveStep(db, store, member, "find", {});
    expect(afterFind.currentStep).toBe("nudges");
    expect(await db.select().from(practicalItem).where(eq(practicalItem.ownerId, member.id))).toEqual([]);

    // Going back and adding the bank after all, then changing it: still one.
    await saveStep(db, store, member, "find", { providerName: "Monzo" });
    await saveStep(db, store, member, "find", { providerName: "Starling" });
    const banks = await db.select().from(practicalItem).where(eq(practicalItem.ownerId, member.id));
    expect(banks.map((b) => b.providerName)).toEqual(["Starling"]);
  });

  it("once finished, saving a step changes nothing", async () => {
    const guest = await addUser(db, { guest: true });
    await untilSignUp(guest);
    const member = await signUp(guest);
    await saveStep(db, store, member, "reach", {});
    await saveStep(db, store, member, "find", {});
    await saveStep(db, store, member, "nudges", { reminderEmails: true });
    await saveStep(db, store, member, "everyone", { choice: "free" });
    await completeOnboarding(db, member);
    // Completing twice is fine.
    expect((await completeOnboarding(db, member)).completed).toBe(true);

    await saveStep(db, store, member, "someone", { name: "Changed", relationship: "son" });
    const [mary] = await db.select().from(person).where(eq(person.ownerId, member.id));
    expect(mary.name).toBe("Mary");
  });

  it("keeps each person's progress apart", async () => {
    const one = await addUser(db, { guest: true });
    const two = await addUser(db, { guest: true });
    await saveStep(db, store, one, "someone", { name: "Mary", relationship: "daughter" });
    expect(await getProgress(db, two.id)).toEqual({ currentStep: "someone", data: {}, completed: false });
    expect((await getOnboardingState(db, two, false)).person).toBeNull();
  });
});

describe("the routing guard's rules", () => {
  const nobody: Visitor = { kind: "none" };
  const guestAt = (currentStep: (typeof steps)[number]): Visitor => ({
    kind: "guest",
    currentStep,
    completed: false,
  });
  const memberAt = (currentStep: (typeof steps)[number], completed = false): Visitor => ({
    kind: "member",
    currentStep,
    completed,
  });

  it("no session: onboarding starts at the beginning, and /home sends them there", () => {
    expect(redirectFor("/start", nobody)).toBe("/start/someone");
    expect(redirectFor("/start/someone", nobody)).toBeNull();
    expect(redirectFor("/start/message", nobody)).toBe("/start/someone");
    expect(redirectFor("/home", nobody)).toBe("/start/someone");
    // There was once a welcome screen before the first question. Its old address leads to the question.
    expect(redirectFor("/start/welcome", nobody)).toBe("/start/someone");
    expect(redirectFor("/signin", nobody)).toBeNull();
  });

  it("a guest partway through goes to their saved step", () => {
    const guest = guestAt("message");
    expect(redirectFor("/start", guest)).toBe("/start/message");
    expect(redirectFor("/home", guest)).toBe("/start/message");
    expect(redirectFor("/start/message", guest)).toBeNull();
    // Back is fine; ahead is not.
    expect(redirectFor("/start/someone", guest)).toBeNull();
    expect(redirectFor("/start/reach", guest)).toBe("/start/message");
    expect(redirectFor("/start/nonsense", guest)).toBe("/start/message");
    // A guest may still sign in to an account they already have.
    expect(redirectFor("/signin", guest)).toBeNull();
  });

  it("a guest never gets past sign-up", () => {
    expect(reachedStep(guestAt("everyone"))).toBe("keep-safe");
    expect(redirectFor("/start/find", guestAt("keep-safe"))).toBe("/start/keep-safe");
  });

  it("signed in but not finished: carries on, and never sees sign-up again", () => {
    const member = memberAt("keep-safe");
    expect(reachedStep(member)).toBe("reach");
    expect(redirectFor("/start/keep-safe", member)).toBe("/start/reach");
    expect(redirectFor("/start", member)).toBe("/start/reach");
    expect(redirectFor("/home", member)).toBe("/start/reach");
    expect(redirectFor("/signin", member)).toBe("/start/reach");
    expect(redirectFor("/start/reach", member)).toBeNull();
    // An account that signed in before ever starting begins at the beginning.
    expect(redirectFor("/home", memberAt("someone"))).toBe("/start/someone");
  });

  it("finished: /home is theirs, and /start and /signin lead there", () => {
    const done = memberAt("everyone", true);
    expect(redirectFor("/home", done)).toBeNull();
    expect(redirectFor("/start", done)).toBe("/home");
    expect(redirectFor("/start/someone", done)).toBe("/home");
    expect(redirectFor("/signin", done)).toBe("/home");
  });

  it("leaves everything else alone", () => {
    expect(redirectFor("/", nobody)).toBeNull();
    expect(redirectFor("/privacy", memberAt("everyone", true))).toBeNull();
    expect(redirectFor("/homepage", nobody)).toBeNull();
    expect(redirectFor("/starters", nobody)).toBeNull();
  });
});
