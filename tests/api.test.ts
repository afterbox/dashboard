import { describe, expect, it } from "vitest";
import * as authRoute from "@/app/api/auth/[...all]/route";
import * as giftRoute from "@/app/api/gifts/[id]/route";
import * as playbackRoute from "@/app/api/gifts/[id]/playback/route";
import * as giftsRoute from "@/app/api/gifts/route";
import * as uploadUrlRoute from "@/app/api/gifts/upload-url/route";
import * as completeRoute from "@/app/api/onboarding/complete/route";
import * as onboardingRoute from "@/app/api/onboarding/route";
import * as personRoute from "@/app/api/people/[id]/route";
import * as peopleRoute from "@/app/api/people/route";
import * as planRoute from "@/app/api/plan/route";
import * as practicalItemRoute from "@/app/api/practical-items/[id]/route";
import * as practicalRoute from "@/app/api/practical-items/route";
import * as preferencesRoute from "@/app/api/preferences/route";
import * as sessionRoute from "@/app/api/session/route";
import * as otpRoute from "@/app/api/test/otp/route";
import * as storageRoute from "@/app/api/test/storage/[...path]/route";
import { browser, origin, type Browser } from "./helpers";

/**
 * The API as a browser meets it: real route handlers, real sign-in, an
 * in-process database, and stand-ins for storage and email (test mode, set in
 * tests/setup.ts). Nothing is mocked in between.
 */

type Params = Record<string, string | string[]>;
type Handler = (request: Request, context: { params: Promise<never> }) => Promise<Response>;

/** Call a route handler as this browser: its cookies and origin, JSON in and out. */
async function call(
  who: Browser | null,
  handler: unknown,
  options: { method?: string; url?: string; body?: unknown; params?: Params; headers?: Record<string, string> } = {},
) {
  const headers = who ? who.headers() : new Headers({ origin });
  if (options.body !== undefined) headers.set("content-type", "application/json");
  for (const [name, value] of Object.entries(options.headers ?? {})) headers.set(name, value);

  const request = new Request(`${origin}${options.url ?? "/api/x"}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const response = await (handler as Handler)(request, {
    params: Promise.resolve((options.params ?? {}) as never),
  });
  const text = await response.text();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test responses are read loosely
  const data: any = text ? JSON.parse(text) : null;
  return { status: response.status, data, response };
}

const post = (who: Browser | null, handler: unknown, body: unknown = {}, params?: Params) =>
  call(who, handler, { method: "POST", body, params });

let n = 0;
const newEmail = () => `api${++n}-${crypto.randomUUID().slice(0, 6)}@example.com`;

/** A browser signed in to a real account, with the code read from the test-only hook. */
async function signedIn(email = newEmail()) {
  const who = browser(authRoute.POST);
  await who.askForCode(email);
  const { data } = await call(null, otpRoute.GET, { url: `/api/test/otp?email=${encodeURIComponent(email)}` });
  const { status } = await who.signInWithCode(email, data.code);
  expect(status).toBe(200);
  return who;
}

/** A browser with a guest session, begun through our own endpoint. */
async function guest() {
  const who = browser(authRoute.POST);
  const response = await sessionRoute.POST(new Request(`${origin}/api/session`, { method: "POST", headers: who.headers() }), {
    params: Promise.resolve({}),
  });
  expect(response.status).toBe(201);
  for (const cookie of response.headers.getSetCookie()) {
    const [pair] = cookie.split(";");
    who.jar.set(pair.slice(0, pair.indexOf("=")), pair.slice(pair.indexOf("=") + 1));
  }
  return who;
}

/** Record, upload and seal a voice note through the API, as the recorder does. */
async function sealVoice(who: Browser, personId: string, replaces?: string) {
  const ticket = await post(who, uploadUrlRoute.POST, {
    contentType: "audio/webm;codecs=opus",
    sizeBytes: 2048,
    durationSeconds: 12,
  });
  expect(ticket.status).toBe(200);
  const uploadUrl = new URL(ticket.data.uploadUrl);
  const path = uploadUrl.pathname.replace("/api/test/storage/", "").split("/");
  const upload = await storageRoute.PUT(
    new Request(uploadUrl, {
      method: "PUT",
      headers: { "content-type": ticket.data.contentType },
      body: new Uint8Array(2048),
    }),
    { params: Promise.resolve({ path }) },
  );
  expect(upload.status).toBe(200);

  const sealed = await post(who, giftsRoute.POST, {
    kind: "voice",
    personId,
    envelopeTitle: "For Mary, on a hard day",
    storagePath: ticket.data.storagePath,
    durationSeconds: 12,
    replaces,
  });
  return { sealed, storagePath: ticket.data.storagePath as string, uploadUrl };
}

describe("the session endpoint", () => {
  it("tells a new visitor nothing is started yet", async () => {
    const { status, data } = await call(null, sessionRoute.GET);
    expect(status).toBe(200);
    expect(data).toMatchObject({ user: null, currentStep: "someone", completed: false, googleEnabled: false });
  });

  it("starts a guest session, once", async () => {
    const who = await guest();
    const first = await call(who, sessionRoute.GET);
    expect(first.data.user).toEqual({ isGuest: true, email: null, name: null });

    // Asking again doesn't make a second guest: no new session cookie.
    const again = await post(who, sessionRoute.POST);
    expect(again.status).toBe(200);
    const names = again.response.headers.getSetCookie().map((cookie) => cookie.slice(0, cookie.indexOf("=")));
    expect(names).not.toContain("afterbox.session_token");
    expect((await who.whoAmI())!.isAnonymous).toBe(true);
  });

  it("is never cached", async () => {
    const { response } = await call(null, sessionRoute.GET);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
});

describe("every endpoint needs a session", () => {
  const cases: [string, unknown, string, unknown?, Params?][] = [
    ["GET /api/people", peopleRoute.GET, "GET"],
    ["POST /api/people", peopleRoute.POST, "POST", { name: "Mary", relationship: "daughter" }],
    ["PATCH /api/people/:id", personRoute.PATCH, "PATCH", { name: "x" }, { id: crypto.randomUUID() }],
    ["DELETE /api/people/:id", personRoute.DELETE, "DELETE", undefined, { id: crypto.randomUUID() }],
    ["GET /api/gifts", giftsRoute.GET, "GET"],
    ["POST /api/gifts", giftsRoute.POST, "POST", {}],
    ["POST /api/gifts/upload-url", uploadUrlRoute.POST, "POST", {}],
    ["DELETE /api/gifts/:id", giftRoute.DELETE, "DELETE", undefined, { id: crypto.randomUUID() }],
    ["GET /api/gifts/:id/playback", playbackRoute.GET, "GET", undefined, { id: crypto.randomUUID() }],
    ["GET /api/practical-items", practicalRoute.GET, "GET"],
    ["POST /api/practical-items", practicalRoute.POST, "POST", { category: "bank", providerName: "Monzo" }],
    ["DELETE /api/practical-items/:id", practicalItemRoute.DELETE, "DELETE", undefined, { id: crypto.randomUUID() }],
    ["GET /api/preferences", preferencesRoute.GET, "GET"],
    ["PATCH /api/preferences", preferencesRoute.PATCH, "PATCH", { theme: "dark" }],
    ["GET /api/plan", planRoute.GET, "GET"],
    ["POST /api/plan", planRoute.POST, "POST", { choice: "free" }],
    ["POST /api/onboarding", onboardingRoute.POST, "POST", { step: "someone", input: { name: "Mary", relationship: "daughter" } }],
    ["POST /api/onboarding/complete", completeRoute.POST, "POST", {}],
  ];

  it.each(cases)("%s answers 401 without one", async (_name, handler, method, body, params) => {
    const { status, data } = await call(null, handler, { method, body, params });
    expect(status).toBe(401);
    expect(data.error.code).toBe("unauthenticated");
  });

  it("a made-up cookie is no session", async () => {
    const forged = browser(authRoute.POST);
    forged.jar.set("afterbox.session_token", "made-up.signature");
    expect((await call(forged, peopleRoute.GET)).status).toBe(401);
  });
});

describe("requests that change something must come from afterbox", () => {
  it("refuses a request from another site, even with a real session", async () => {
    const who = await signedIn();
    const attempt = await call(who, peopleRoute.POST, {
      method: "POST",
      body: { name: "Mary", relationship: "daughter" },
      headers: { origin: "https://evil.example" },
    });
    expect(attempt.status).toBe(401);
    expect((await call(who, peopleRoute.GET)).data.people).toEqual([]);
  });
});

describe("onboarding, end to end through the API", () => {
  it("a guest builds a gift, signs up, and everything is theirs on /home", async () => {
    const who = await guest();
    const save = (step: string, input?: unknown) => post(who, onboardingRoute.POST, { step, input });

    const someone = await save("someone", { name: "Mary", relationship: "daughter" });
    expect(someone.data).toMatchObject({ currentStep: "message", person: { name: "Mary" } });

    const message = await save("message", {
      kind: "letter",
      envelopeTitle: "For Mary, on a hard day",
      letterText: "I'm with you.",
    });
    expect(message.data).toMatchObject({ currentStep: "keep-safe", gift: { kind: "letter" } });

    // A refresh: the same state comes back from the server.
    const resumed = await call(who, onboardingRoute.GET);
    expect(resumed.data).toMatchObject({
      currentStep: "keep-safe",
      user: { isGuest: true },
      person: { name: "Mary" },
      gift: { envelopeTitle: "For Mary, on a hard day" },
    });

    // A guest can't go further, or finish.
    expect((await save("reach", {})).status).toBe(409);
    expect((await post(who, completeRoute.POST)).status).toBe(403);

    // Sign up with a code (read from the test-only hook).
    const email = newEmail();
    await who.askForCode(email);
    const { data: hook } = await call(null, otpRoute.GET, { url: `/api/test/otp?email=${encodeURIComponent(email)}` });
    expect((await who.signInWithCode(email, hook.code)).status).toBe(200);

    const after = await call(who, onboardingRoute.GET);
    expect(after.data).toMatchObject({
      currentStep: "reach",
      user: { isGuest: false, email },
      person: { name: "Mary" },
      gift: { kind: "letter" },
    });

    expect((await save("reach", { email: "mary@example.com" })).data.currentStep).toBe("find");
    const refused = await save("find", { providerName: "Monzo 12345678" });
    expect(refused.status).toBe(400);
    expect(refused.data.error.message).toMatch(/Just the name is enough/);
    expect((await save("find", { providerName: "Monzo" })).data).toMatchObject({
      currentStep: "nudges",
      bank: { providerName: "Monzo" },
    });
    expect((await save("nudges", { reminderEmails: true })).data.currentStep).toBe("everyone");
    expect((await save("everyone", { choice: "free" })).data.planChoice).toBe("free");
    expect((await post(who, completeRoute.POST)).data.completed).toBe(true);

    // /home's data.
    const people = (await call(who, peopleRoute.GET)).data.people;
    expect(people).toHaveLength(1);
    expect(people[0]).toMatchObject({ name: "Mary", email: "mary@example.com" });
    expect((await call(who, giftsRoute.GET, { url: `/api/gifts?personId=${people[0].id}` })).data.gifts).toHaveLength(1);
    expect((await call(who, practicalRoute.GET)).data.items).toMatchObject([{ providerName: "Monzo" }]);
    expect((await call(who, planRoute.GET)).data.choice).toBe("free");
  });

  it("refuses a step it doesn't know", async () => {
    const who = await guest();
    const { status, data } = await post(who, onboardingRoute.POST, { step: "payment" });
    expect(status).toBe(400);
    expect(data.error.code).toBe("invalid_input");
  });
});

describe("the free plan, through the API", () => {
  it("answers a second person with 402 upgrade_required", async () => {
    const who = await signedIn();
    const first = await post(who, peopleRoute.POST, { name: "Mary", relationship: "daughter" });
    expect(first.status).toBe(201);

    const second = await post(who, peopleRoute.POST, { name: "Tom", relationship: "son" });
    expect(second.status).toBe(402);
    expect(second.data.error.code).toBe("upgrade_required");
    expect(second.data.error.message).toMatch(/free plan is for one person/);

    expect((await call(who, peopleRoute.GET)).data.people).toHaveLength(1);
  });
});

describe("ownership, through the API", () => {
  it("user A can't read, play, change or delete user B's people, gifts or files", async () => {
    const b = await signedIn();
    const mary = (await post(b, peopleRoute.POST, { name: "Mary", relationship: "daughter" })).data.person;
    const { sealed, storagePath, uploadUrl } = await sealVoice(b, mary.id);
    expect(sealed.status).toBe(201);
    const giftId = sealed.data.gift.id;
    const item = (await post(b, practicalRoute.POST, { category: "bank", providerName: "Monzo" })).data.item;
    await call(b, preferencesRoute.PATCH, { method: "PATCH", body: { theme: "dark" } });

    const a = await signedIn();
    const anna = (await post(a, peopleRoute.POST, { name: "Anna", relationship: "partner" })).data.person;

    // Read.
    expect((await call(a, peopleRoute.GET)).data.people.map((p: { name: string }) => p.name)).toEqual(["Anna"]);
    expect((await call(a, giftsRoute.GET)).data.gifts).toEqual([]);
    expect((await call(a, giftsRoute.GET, { url: `/api/gifts?personId=${mary.id}` })).data.gifts).toEqual([]);
    expect((await call(a, practicalRoute.GET)).data.items).toEqual([]);
    expect((await call(a, preferencesRoute.GET)).data.preference.theme).toBe("system");

    // Play.
    const play = await call(a, playbackRoute.GET, { params: { id: giftId } });
    expect(play.status).toBe(404);
    expect(JSON.stringify(play.data)).not.toContain("token");

    // Change.
    expect(
      (await call(a, personRoute.PATCH, { method: "PATCH", body: { name: "Changed" }, params: { id: mary.id } })).status,
    ).toBe(404);
    // Seal a gift for B's person.
    expect(
      (await post(a, giftsRoute.POST, { kind: "letter", personId: mary.id, envelopeTitle: "x", letterText: "x" })).status,
    ).toBe(404);
    // Replace B's gift with one of their own.
    expect(
      (
        await post(a, giftsRoute.POST, {
          kind: "letter",
          personId: anna.id,
          envelopeTitle: "x",
          letterText: "x",
          replaces: giftId,
        })
      ).status,
    ).toBe(404);
    // Claim B's recording as their own gift.
    expect(
      (
        await post(a, giftsRoute.POST, {
          kind: "voice",
          personId: anna.id,
          envelopeTitle: "x",
          storagePath,
          durationSeconds: 12,
        })
      ).status,
    ).toBe(404);

    // Delete.
    expect((await call(a, giftRoute.DELETE, { method: "DELETE", params: { id: giftId } })).status).toBe(404);
    expect((await call(a, personRoute.DELETE, { method: "DELETE", params: { id: mary.id } })).status).toBe(404);
    expect((await call(a, practicalItemRoute.DELETE, { method: "DELETE", params: { id: item.id } })).status).toBe(404);

    // Files: the upload link was for one upload, and a path alone opens nothing.
    const path = storagePath.split("/");
    const reuse = await storageRoute.PUT(
      new Request(uploadUrl, { method: "PUT", headers: { "content-type": "audio/webm" }, body: new Uint8Array(10) }),
      { params: Promise.resolve({ path }) },
    );
    expect(reuse.status).toBe(403);
    const direct = await storageRoute.GET(new Request(`${origin}/api/test/storage/${storagePath}`), {
      params: Promise.resolve({ path }),
    });
    expect(direct.status).toBe(404);

    // B still has everything, and can play their own recording.
    expect((await call(b, peopleRoute.GET)).data.people).toMatchObject([{ name: "Mary" }]);
    expect((await call(b, giftsRoute.GET)).data.gifts).toHaveLength(1);
    expect((await call(b, practicalRoute.GET)).data.items).toHaveLength(1);
    const own = await call(b, playbackRoute.GET, { params: { id: giftId } });
    expect(own.status).toBe(200);
    expect(own.data.expiresInSeconds).toBeLessThanOrEqual(120);
    const playUrl = new URL(own.data.url);
    const audio = await storageRoute.GET(new Request(playUrl), { params: Promise.resolve({ path }) });
    expect(audio.status).toBe(200);
    expect(audio.headers.get("content-type")).toBe("audio/webm");
    expect((await audio.arrayBuffer()).byteLength).toBe(2048);
  });

  it("an id that isn't an id is simply not found", async () => {
    const who = await signedIn();
    expect((await call(who, personRoute.DELETE, { method: "DELETE", params: { id: "1; drop table person" } })).status).toBe(
      404,
    );
    expect((await call(who, playbackRoute.GET, { params: { id: "../../etc" } })).status).toBe(404);
  });
});

describe("recordings, through the API", () => {
  it.each([
    ["video", { contentType: "video/webm", sizeBytes: 2048, durationSeconds: 12 }],
    ["more than 10 MB", { contentType: "audio/webm", sizeBytes: 10 * 1024 * 1024 + 1, durationSeconds: 12 }],
    ["more than 3 minutes", { contentType: "audio/webm", sizeBytes: 2048, durationSeconds: 181 }],
  ])("refuses an upload URL for %s", async (_what, input) => {
    const who = await signedIn();
    const { status, data } = await post(who, uploadUrlRoute.POST, input);
    expect(status).toBe(400);
    expect(data.error.code).toBe("invalid_input");
    expect(data.uploadUrl).toBeUndefined();
  });

  it("re-recording replaces the old one; deleting removes it", async () => {
    const who = await signedIn();
    const mary = (await post(who, peopleRoute.POST, { name: "Mary", relationship: "daughter" })).data.person;
    const first = await sealVoice(who, mary.id);
    const second = await sealVoice(who, mary.id, first.sealed.data.gift.id);
    expect(second.sealed.status).toBe(201);

    const gifts = (await call(who, giftsRoute.GET)).data.gifts;
    expect(gifts.map((g: { id: string }) => g.id)).toEqual([second.sealed.data.gift.id]);
    // What the browser is given never includes where a recording is stored.
    expect(JSON.stringify(gifts)).not.toContain(second.storagePath);

    const removed = await call(who, giftRoute.DELETE, { method: "DELETE", params: { id: gifts[0].id } });
    expect(removed.status).toBe(204);
    expect((await call(who, giftsRoute.GET)).data.gifts).toEqual([]);
  });
});

describe("preferences and plan, through the API", () => {
  it("stores the theme", async () => {
    const who = await signedIn();
    expect((await call(who, preferencesRoute.GET)).data.preference).toEqual({ theme: "system", reminderEmails: true });
    const changed = await call(who, preferencesRoute.PATCH, { method: "PATCH", body: { theme: "dark" } });
    expect(changed.data.preference).toEqual({ theme: "dark", reminderEmails: true });
    expect((await call(who, preferencesRoute.GET)).data.preference.theme).toBe("dark");
    expect((await call(who, preferencesRoute.PATCH, { method: "PATCH", body: { theme: "sepia" } })).status).toBe(400);
  });

  it("records the plan choice", async () => {
    const who = await signedIn();
    expect((await call(who, planRoute.GET)).data.choice).toBeNull();
    expect((await post(who, planRoute.POST, { choice: "paid_interest" })).status).toBe(201);
    expect((await call(who, planRoute.GET)).data.choice).toBe("paid_interest");
    expect((await post(who, planRoute.POST, { choice: "lifetime" })).status).toBe(400);
  });
});

describe("what the API says when something is wrong", () => {
  it("unreadable JSON is a kind 400, not a crash", async () => {
    const who = await signedIn();
    const request = new Request(`${origin}/api/people`, {
      method: "POST",
      headers: (() => {
        const h = who.headers();
        h.set("content-type", "application/json");
        return h;
      })(),
      body: "{not json",
    });
    const response = await peopleRoute.POST(request, { params: Promise.resolve({}) });
    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe("invalid_input");
  });

  it("says which field, in plain words", async () => {
    const who = await signedIn();
    const { status, data } = await post(who, peopleRoute.POST, { name: "", relationship: "daughter" });
    expect(status).toBe(400);
    expect(data.error).toEqual({
      code: "invalid_input",
      message: "Tell us their name.",
      fields: { name: "Tell us their name." },
    });
  });
});
