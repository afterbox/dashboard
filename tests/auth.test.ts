import { eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  gift,
  onboardingProgress,
  person,
  planInterest,
  practicalItem,
  preference,
  session,
  throttle,
  user,
  verification,
} from "@/server/db/schema";
import type { Db } from "@/server/db/types";
import { codeEmail } from "@/server/email";
import { createGift } from "@/server/services/gifts";
import { moveGuestData } from "@/server/services/link";
import { completeOnboarding, getOnboardingState, saveStep } from "@/server/services/onboarding";
import { createPerson, listPeople } from "@/server/services/people";
import { recordPlanChoice } from "@/server/services/plan";
import { createPracticalItem } from "@/server/services/practical";
import { getPreference, updatePreference } from "@/server/services/preferences";
import { emailKey, hit } from "@/server/services/throttle";
import { addUser, browser, fakeStore, query, testAuth, testDb } from "./helpers";

let db: Db;
let close: () => Promise<void>;

beforeAll(async () => {
  ({ db, close } = await testDb());
});
afterAll(() => close());

let n = 0;
const newEmail = () => `dad${++n}-${crypto.randomUUID().slice(0, 6)}@example.com`;

/** Everything a guest makes before sign-up, and a little more, so every table has a row of theirs. */
async function buildAsGuest(guestId: string, name = "Mary") {
  const guest = { id: guestId, isAnonymous: true };
  const store = fakeStore();
  await saveStep(db, store, guest, "someone", { name, relationship: "daughter" });

  const recording = `${guestId}/${crypto.randomUUID()}.webm`;
  store.put(recording);
  await saveStep(db, store, guest, "message", {
    kind: "voice",
    envelopeTitle: `For ${name}, on a hard day`,
    storagePath: recording,
    durationSeconds: 41,
  });
  await createPracticalItem(db, guestId, { category: "bank", providerName: "Monzo" });
  await updatePreference(db, guestId, { theme: "dark", reminderEmails: false });
  await recordPlanChoice(db, guestId, "paid_interest");
  return { store, recording };
}

const rowsOwnedBy = async (id: string) => ({
  people: (await db.select().from(person).where(eq(person.ownerId, id))).length,
  gifts: (await db.select().from(gift).where(eq(gift.ownerId, id))).length,
  items: (await db.select().from(practicalItem).where(eq(practicalItem.ownerId, id))).length,
  progress: (await db.select().from(onboardingProgress).where(eq(onboardingProgress.userId, id))).length,
  preferences: (await db.select().from(preference).where(eq(preference.userId, id))).length,
  plans: (await db.select().from(planInterest).where(eq(planInterest.userId, id))).length,
});

const nothing = { people: 0, gifts: 0, items: 0, progress: 0, preferences: 0, plans: 0 };
const oneOfEach = { people: 1, gifts: 1, items: 1, progress: 1, preferences: 1, plans: 1 };

describe("guest sessions", () => {
  it("gives a first-time visitor a guest account and a session", async () => {
    const { auth } = testAuth(db);
    const visitor = browser(auth.handler);
    expect(await visitor.whoAmI()).toBeNull();

    const guestId = await visitor.beginAsGuest();
    const me = await visitor.whoAmI();
    expect(me).toMatchObject({ id: guestId, isAnonymous: true });

    const [row] = await db.select().from(user).where(eq(user.id, guestId));
    expect(row.isAnonymous).toBe(true);
    // A placeholder address that can never receive mail.
    expect(row.email).toMatch(/@guest\.afterbox\.invalid$/);
    expect(await db.select().from(session).where(eq(session.userId, guestId))).toHaveLength(1);
  });

  it("each visitor gets their own", async () => {
    const { auth } = testAuth(db);
    const one = await browser(auth.handler).beginAsGuest();
    const two = await browser(auth.handler).beginAsGuest();
    expect(one).not.toBe(two);
  });

  it("the session cookie is httpOnly, and Secure in production", async () => {
    const dev = browser(testAuth(db).auth.handler);
    await dev.beginAsGuest();
    const devCookie = dev.setCookies.find((c) => c.startsWith("afterbox.session_token="));
    expect(devCookie).toBeDefined();
    expect(devCookie).toMatch(/HttpOnly/i);
    expect(devCookie).toMatch(/SameSite=Lax/i);
    expect(devCookie).toMatch(/Max-Age=2592000/i); // 30 days

    const live = browser(testAuth(db, { production: true, baseURL: "http://localhost:3000" }).auth.handler);
    await live.beginAsGuest();
    const liveCookie = live.setCookies.find((c) => c.includes("session_token="));
    expect(liveCookie).toMatch(/^__Secure-/);
    expect(liveCookie).toMatch(/;\s*Secure/i);
    expect(liveCookie).toMatch(/HttpOnly/i);
  });
});

describe("sign-in codes", () => {
  it("emails a 6-digit code, in the brand voice, naming who the gift is for", async () => {
    const { auth, inbox } = testAuth(db);
    const visitor = browser(auth.handler);
    const guestId = await visitor.beginAsGuest();
    await buildAsGuest(guestId);

    const email = newEmail();
    const { status } = await visitor.askForCode(email);
    expect(status).toBe(200);

    const [message] = inbox.sent;
    expect(message.to).toBe(email);
    expect(message.code).toMatch(/^\d{6}$/);
    expect(message.personName).toBe("Mary");

    const { subject, text, html } = codeEmail(message);
    expect(text).toContain(`Your afterbox code is ${message.code}. It keeps your gift for Mary safe.`);
    expect(subject).toBe(`Your afterbox code is ${message.code}`);
    expect(html).toContain(message.code);
    expect(text).toContain("We never ask for passwords, PINs or card numbers.");
    // The name is always written in lowercase, even at the start of a line.
    expect(`${subject}\n${text}\n${html}`).not.toMatch(/Afterbox/);
  });

  it("says something sensible when we don't know who the gift is for", () => {
    const { text } = codeEmail({ code: "482913" });
    expect(text).toContain("Your afterbox code is 482913. It keeps what you've made safe.");
  });

  it("keeps a name to plain text in the email", () => {
    const { html, text } = codeEmail({ code: "482913", personName: 'Mary<script>alert("x")</script>\nBcc: x@y.z' });
    expect(html).not.toContain("<script>");
    expect(text.split("\n")[0]).toContain("It keeps your gift for Mary");
  });

  it("stores only a hash of the code", async () => {
    const { auth, inbox } = testAuth(db);
    const email = newEmail();
    await browser(auth.handler).askForCode(email);
    const code = inbox.codeFor(email);

    const rows = await db.select().from(verification);
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) expect(row.value).not.toContain(code);
  });

  it("signs in with the right code, once", async () => {
    const { auth, inbox } = testAuth(db);
    const visitor = browser(auth.handler);
    const email = newEmail();
    await visitor.askForCode(email);
    const code = inbox.codeFor(email);

    expect((await visitor.signInWithCode(email, code)).status).toBe(200);
    expect(await visitor.whoAmI()).toMatchObject({ email, isAnonymous: false });

    // The same code can't be used again, from anywhere.
    const other = browser(auth.handler);
    expect((await other.signInWithCode(email, code)).status).toBeGreaterThanOrEqual(400);
    expect(await other.whoAmI()).toBeNull();
  });

  it("refuses a wrong code, and gives up on a code after three wrong guesses", async () => {
    const { auth, inbox } = testAuth(db);
    const visitor = browser(auth.handler);
    const email = newEmail();
    await visitor.askForCode(email);
    const code = inbox.codeFor(email);
    const wrong = code === "000000" ? "111111" : "000000";

    for (let i = 0; i < 3; i++) {
      expect((await visitor.signInWithCode(email, wrong)).status).toBeGreaterThanOrEqual(400);
    }
    // Even the right code no longer works: they need a new one.
    expect((await visitor.signInWithCode(email, code)).status).toBeGreaterThanOrEqual(400);
    expect(await visitor.whoAmI()).toBeNull();

    await visitor.askForCode(email);
    expect((await visitor.signInWithCode(email, inbox.codeFor(email))).status).toBe(200);
  });

  it("a code expires after five minutes", async () => {
    const { auth, inbox } = testAuth(db);
    const visitor = browser(auth.handler);
    const email = newEmail();
    await visitor.askForCode(email);
    await db.update(verification).set({ expiresAt: new Date(Date.now() - 1000) });
    expect((await visitor.signInWithCode(email, inbox.codeFor(email))).status).toBeGreaterThanOrEqual(400);
    expect(await visitor.whoAmI()).toBeNull();
  });
});

describe("rate limits on sign-in codes", () => {
  it("limits how many codes can be asked for, per email address", async () => {
    let now = new Date("2026-01-01T09:00:00Z");
    const { auth, inbox } = testAuth(db, {
      limits: { perAddress: false, codeRequests: { max: 3, windowSeconds: 600 } },
      now: () => now,
    });
    const email = newEmail();

    // From three different browsers: it is the address that is counted.
    for (let i = 0; i < 3; i++) expect((await browser(auth.handler).askForCode(email)).status).toBe(200);

    const refused = await browser(auth.handler).askForCode(email);
    expect(refused.status).toBe(429);
    expect(refused.data.message).toMatch(/sent a few codes to that address already/);
    expect(inbox.sent.filter((m) => m.to === email)).toHaveLength(3);

    // Capitals and spaces don't make it a different address.
    expect((await browser(auth.handler).askForCode(email.toUpperCase())).status).toBe(429);
    // Someone else is unaffected.
    expect((await browser(auth.handler).askForCode(newEmail())).status).toBe(200);

    // Later, they can ask again.
    now = new Date(now.getTime() + 601_000);
    expect((await browser(auth.handler).askForCode(email)).status).toBe(200);
  });

  it("limits how many guesses can be made, per email address, across codes", async () => {
    let now = new Date("2026-01-01T09:00:00Z");
    const { auth, inbox } = testAuth(db, {
      limits: {
        perAddress: false,
        codeRequests: { max: 100, windowSeconds: 600 },
        codeAttempts: { max: 4, windowSeconds: 600 },
      },
      now: () => now,
    });
    const email = newEmail();
    const visitor = browser(auth.handler);

    // Asking for fresh codes doesn't buy more guesses.
    for (let i = 0; i < 4; i++) {
      await visitor.askForCode(email);
      const code = inbox.codeFor(email);
      const wrong = code === "000000" ? "111111" : "000000";
      const guess = await visitor.signInWithCode(email, wrong);
      expect(guess.status).toBeGreaterThanOrEqual(400);
      expect(guess.status).not.toBe(429);
    }

    await visitor.askForCode(email);
    const refused = await visitor.signInWithCode(email, inbox.codeFor(email));
    expect(refused.status).toBe(429);
    expect(refused.data.message).toMatch(/few tries too many/);
    expect(await visitor.whoAmI()).toBeNull();

    // Later, with a new code, they are let in.
    now = new Date(now.getTime() + 601_000);
    await visitor.askForCode(email);
    expect((await visitor.signInWithCode(email, inbox.codeFor(email))).status).toBe(200);
  });

  it("keeps no email addresses in the limiter's table", async () => {
    const key = await emailKey("code-request", "  Dad@Example.com ");
    expect(key).toBe(await emailKey("code-request", "dad@example.com"));
    expect(key).not.toContain("dad");
    expect(key).not.toBe(await emailKey("code-attempt", "dad@example.com"));

    const keys = (await db.select({ key: throttle.key }).from(throttle)).map((row) => row.key);
    expect(keys.length).toBeGreaterThan(0);
    for (const k of keys) expect(k).not.toContain("@");
  });

  it("the counter itself: a window, then a fresh start", async () => {
    const limit = { max: 2, windowSeconds: 60 };
    const start = new Date("2026-01-01T09:00:00Z");
    const at = (seconds: number) => new Date(start.getTime() + seconds * 1000);
    const key = `test:${crypto.randomUUID()}`;

    expect(await hit(db, key, limit, at(0))).toEqual({ allowed: true, retryAfterSeconds: 0 });
    expect(await hit(db, key, limit, at(10))).toEqual({ allowed: true, retryAfterSeconds: 0 });
    expect(await hit(db, key, limit, at(20))).toEqual({ allowed: false, retryAfterSeconds: 40 });
    expect(await hit(db, key, limit, at(59))).toEqual({ allowed: false, retryAfterSeconds: 1 });
    expect(await hit(db, key, limit, at(61))).toEqual({ allowed: true, retryAfterSeconds: 0 });
  });

  it("also limits by where requests come from (Better Auth's own limiter, kept in the database)", async () => {
    const { auth } = testAuth(db, { limits: { perAddress: true } });
    const ip = "203.0.113.7";

    const statuses: number[] = [];
    for (let i = 0; i < 5; i++) {
      // A different email address each time: only the IP address is the same.
      statuses.push((await browser(auth.handler, { ip }).askForCode(newEmail())).status);
    }
    expect(statuses.slice(0, 3)).toEqual([200, 200, 200]);
    expect(statuses.slice(3)).toEqual([429, 429]);

    // From somewhere else, it still works.
    expect((await browser(auth.handler, { ip: "203.0.113.8" }).askForCode(newEmail())).status).toBe(200);

    const [{ count }] = await query<{ count: number }>(db, sql`select count(*)::int as count from rate_limit`);
    expect(count).toBeGreaterThan(0);
  });
});

describe("a guest becomes an account", () => {
  it("moves every row to the new account, and removes the guest", async () => {
    const { auth, inbox } = testAuth(db);
    const visitor = browser(auth.handler);
    const guestId = await visitor.beginAsGuest();
    const { recording } = await buildAsGuest(guestId);
    expect(await rowsOwnedBy(guestId)).toEqual(oneOfEach);

    const email = newEmail();
    await visitor.askForCode(email);
    const signedIn = await visitor.signInWithCode(email, inbox.codeFor(email));
    expect(signedIn.status).toBe(200);

    const me = await visitor.whoAmI();
    expect(me).toMatchObject({ email, isAnonymous: false });
    const accountId = me!.id;
    expect(accountId).not.toBe(guestId);

    // Everything moved…
    expect(await rowsOwnedBy(accountId)).toEqual(oneOfEach);
    // …nothing was left behind, and the guest is gone.
    expect(await rowsOwnedBy(guestId)).toEqual(nothing);
    expect(await db.select().from(user).where(eq(user.id, guestId))).toEqual([]);
    expect(await db.select().from(session).where(eq(session.userId, guestId))).toEqual([]);

    // And it is all still what they made.
    const account = { id: accountId, isAnonymous: false, email };
    const state = await getOnboardingState(db, account, false);
    expect(state).toMatchObject({
      user: { isGuest: false, email },
      // Signed up, so they are past the sign-up screen.
      currentStep: "reach",
      person: { name: "Mary", relationship: "daughter" },
      gift: { kind: "voice", envelopeTitle: "For Mary, on a hard day", durationSeconds: 41 },
      preference: { theme: "dark", reminderEmails: false },
      planChoice: "paid_interest",
    });
    const [sealed] = await db.select().from(gift).where(eq(gift.ownerId, accountId));
    // The recording stays where it was; who owns it is the gift row.
    expect(sealed.storagePath).toBe(recording);

    // They can carry straight on.
    expect((await saveStep(db, fakeStore(), account, "reach", {})).currentStep).toBe("find");
  });

  it("joins an account that already exists, and never drops anything because of the plan", async () => {
    const { auth, inbox } = testAuth(db);
    const email = newEmail();

    // Earlier, on another device: an account that finished onboarding, for Tom.
    const laptop = browser(auth.handler);
    await laptop.askForCode(email);
    await laptop.signInWithCode(email, inbox.codeFor(email));
    const accountId = (await laptop.whoAmI())!.id;
    const account = { id: accountId, isAnonymous: false, email };
    const store = fakeStore();
    await saveStep(db, store, account, "someone", { name: "Tom", relationship: "son" });
    await saveStep(db, store, account, "message", { kind: "letter", envelopeTitle: "For Tom", letterText: "Hello." });
    await saveStep(db, store, account, "reach", {});
    await saveStep(db, store, account, "find", {});
    await saveStep(db, store, account, "nudges", { reminderEmails: true });
    await completeOnboarding(db, account);
    await updatePreference(db, accountId, { theme: "light" });

    // Today, on a phone: they start again as a guest, for Mary, then sign in.
    const phone = browser(auth.handler);
    const guestId = await phone.beginAsGuest();
    await buildAsGuest(guestId);
    await phone.askForCode(email);
    expect((await phone.signInWithCode(email, inbox.codeFor(email))).status).toBe(200);
    expect((await phone.whoAmI())!.id).toBe(accountId);

    // Both people and both messages are kept, though the free plan is one person.
    expect((await listPeople(db, accountId)).map((p) => p.name).sort()).toEqual(["Mary", "Tom"]);
    expect(await db.select().from(gift).where(eq(gift.ownerId, accountId))).toHaveLength(2);
    expect(await rowsOwnedBy(guestId)).toEqual(nothing);
    expect(await db.select().from(user).where(eq(user.id, guestId))).toEqual([]);

    // The account had finished onboarding, and still has; its own preferences stand.
    expect((await getOnboardingState(db, account, false)).completed).toBe(true);
    expect(await getPreference(db, accountId)).toEqual({ theme: "light", reminderEmails: true });
    // Both plan choices are on record.
    expect(await db.select().from(planInterest).where(eq(planInterest.userId, accountId))).toHaveLength(2);
  });

  it("an unfinished account takes up the guest's progress when the guest is further on", async () => {
    const account = await addUser(db);
    // The account has been to the first question, and no further.
    await db.insert(onboardingProgress).values({ userId: account.id, currentStep: "someone" });

    const guest = await addUser(db, { guest: true });
    await buildAsGuest(guest.id);
    await moveGuestData(db, guest.id, account.id);

    const state = await getOnboardingState(db, account, false);
    expect(state.currentStep).toBe("reach");
    expect(state.person).toMatchObject({ name: "Mary" });
    expect(state.gift).toMatchObject({ kind: "voice" });
  });

  it("moves everything or nothing", async () => {
    const guest = await addUser(db, { guest: true });
    const account = await addUser(db);
    await buildAsGuest(guest.id);

    // Something goes wrong partway through: practical items can't be moved.
    await db.execute(sql`
      create function refuse_move() returns trigger as $$
      begin raise exception 'simulated failure'; end;
      $$ language plpgsql
    `);
    await db.execute(sql`
      create trigger refuse_move before update on practical_item
      for each row execute function refuse_move()
    `);
    try {
      await expect(moveGuestData(db, guest.id, account.id)).rejects.toThrow();
    } finally {
      await db.execute(sql`drop trigger refuse_move on practical_item`);
      await db.execute(sql`drop function refuse_move()`);
    }

    // People and gifts are moved before practical items; they must have been put back.
    expect(await rowsOwnedBy(guest.id)).toEqual(oneOfEach);
    expect(await rowsOwnedBy(account.id)).toEqual(nothing);

    // And once it works, it all goes across.
    await moveGuestData(db, guest.id, account.id);
    expect(await rowsOwnedBy(account.id)).toEqual(oneOfEach);
    expect(await rowsOwnedBy(guest.id)).toEqual(nothing);
  });

  it("if the move fails, sign-in fails and the guest keeps everything", async () => {
    const { auth, inbox } = testAuth(db);
    const visitor = browser(auth.handler);
    const guestId = await visitor.beginAsGuest();
    await buildAsGuest(guestId);
    const email = newEmail();
    await visitor.askForCode(email);

    await db.execute(sql`
      create function refuse_move() returns trigger as $$
      begin raise exception 'simulated failure'; end;
      $$ language plpgsql
    `);
    await db.execute(sql`
      create trigger refuse_move before update on practical_item
      for each row execute function refuse_move()
    `);
    let status: number;
    try {
      ({ status } = await visitor.signInWithCode(email, inbox.codeFor(email)));
    } finally {
      await db.execute(sql`drop trigger refuse_move on practical_item`);
      await db.execute(sql`drop function refuse_move()`);
    }

    expect(status).toBeGreaterThanOrEqual(500);
    // Still the guest, with everything they made.
    expect(await visitor.whoAmI()).toMatchObject({ id: guestId, isAnonymous: true });
    expect(await rowsOwnedBy(guestId)).toEqual(oneOfEach);
  });

  it("a guest's data is never reachable by another guest", async () => {
    const { auth } = testAuth(db);
    const oneId = await browser(auth.handler).beginAsGuest();
    const twoId = await browser(auth.handler).beginAsGuest();
    await buildAsGuest(oneId);
    expect(await rowsOwnedBy(twoId)).toEqual(nothing);
    expect(await listPeople(db, twoId)).toEqual([]);
  });
});

describe("signing out", () => {
  async function signIn(auth: ReturnType<typeof testAuth>["auth"], inbox: ReturnType<typeof testAuth>["inbox"], email: string) {
    const device = browser(auth.handler);
    await device.askForCode(email);
    await device.signInWithCode(email, inbox.codeFor(email));
    return device;
  }

  it("signs out of this device only", async () => {
    const { auth, inbox } = testAuth(db);
    const email = newEmail();
    const phone = await signIn(auth, inbox, email);
    const laptop = await signIn(auth, inbox, email);

    expect((await phone.post("/api/auth/sign-out")).status).toBe(200);
    expect(await phone.whoAmI()).toBeNull();
    expect(await laptop.whoAmI()).toMatchObject({ email });
  });

  it("signs out everywhere", async () => {
    const { auth, inbox } = testAuth(db);
    const email = newEmail();
    const phone = await signIn(auth, inbox, email);
    const laptop = await signIn(auth, inbox, email);
    const accountId = (await phone.whoAmI())!.id;
    expect(await db.select().from(session).where(eq(session.userId, accountId))).toHaveLength(2);

    expect((await phone.post("/api/auth/revoke-sessions")).status).toBe(200);

    expect(await db.select().from(session).where(eq(session.userId, accountId))).toEqual([]);
    // Anything checked against the database (every change) finds no session, at once.
    expect(await laptop.whoAmI({ fresh: true })).toBeNull();
    expect(await phone.whoAmI({ fresh: true })).toBeNull();

    // A read may trust the laptop's 2-minute cookie copy, but no longer than that.
    vi.useFakeTimers({ toFake: ["Date"] });
    try {
      vi.setSystemTime(Date.now() + 2 * 60 * 1000 + 1000);
      expect(await laptop.whoAmI()).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("signing out keeps everything they made", async () => {
    const { auth, inbox } = testAuth(db);
    const email = newEmail();
    const phone = await signIn(auth, inbox, email);
    const accountId = (await phone.whoAmI())!.id;
    const mary = await createPerson(db, accountId, { name: "Mary", relationship: "daughter" });
    await createGift(db, fakeStore(), accountId, {
      kind: "letter",
      personId: mary.id,
      envelopeTitle: "For Mary",
      letterText: "Hello.",
    });

    await phone.post("/api/auth/sign-out");
    const back = await signIn(auth, inbox, email);
    expect((await back.whoAmI())!.id).toBe(accountId);
    expect(await listPeople(db, accountId)).toHaveLength(1);
  });
});

describe("Google sign-in", () => {
  it("is off until both of its keys are set", async () => {
    const { auth } = testAuth(db);
    expect(auth.options.socialProviders).toEqual({});
    const attempt = await browser(auth.handler).post("/api/auth/sign-in/social", {
      provider: "google",
      callbackURL: "/home",
    });
    expect(attempt.status).toBeGreaterThanOrEqual(400);
  });

  it("switches on by itself when they are", async () => {
    const { auth } = testAuth(db, { google: { clientId: "test-client-id", clientSecret: "test-client-secret" } });
    const attempt = await browser(auth.handler).post("/api/auth/sign-in/social", {
      provider: "google",
      callbackURL: "/home",
    });
    expect(attempt.status).toBe(200);
    expect(attempt.data.url).toMatch(/^https:\/\/accounts\.google\.com\//);
    // The secret never leaves the server.
    expect(attempt.data.url).not.toContain("test-client-secret");
  });
});
