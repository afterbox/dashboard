import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as authRoute from "@/app/api/auth/[...all]/route";
import * as onboardingRoute from "@/app/api/onboarding/route";
import * as peopleRoute from "@/app/api/people/route";
import * as sessionRoute from "@/app/api/session/route";
import * as otpRoute from "@/app/api/test/otp/route";
import { proxy } from "@/proxy";
import {
  readVisitorHint,
  sessionCookieOf,
  signVisitorHint,
  visitorHintCookie,
} from "@/server/visitor-hint";
import { browser, origin, type Browser } from "./helpers";

/**
 * The routing guard's hint of where someone is (src/server/visitor-hint.ts),
 * and the session's cookie copy: what lets most requests skip the database,
 * and what keeps that from opening anything.
 */

type Handler = (request: Request, context: { params: Promise<never> }) => Promise<Response>;

async function call(who: Browser, handler: unknown, method = "GET", body?: unknown) {
  const headers = who.headers();
  if (body !== undefined) headers.set("content-type", "application/json");
  const request = new Request(`${origin}/api/x`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return (handler as Handler)(request, { params: Promise.resolve({} as never) });
}

async function guest() {
  const who = browser(authRoute.POST);
  const response = await call(who, sessionRoute.POST, "POST", {});
  expect(response.status).toBe(201);
  // Keep the session cookie it was given.
  for (const cookie of response.headers.getSetCookie()) {
    const pair = cookie.split(";")[0];
    who.jar.set(pair.slice(0, pair.indexOf("=")), pair.slice(pair.indexOf("=") + 1));
  }
  return who;
}

let n = 0;
async function signedIn(email = `hint${++n}-${crypto.randomUUID().slice(0, 6)}@example.com`) {
  const who = browser(authRoute.POST);
  await who.askForCode(email);
  const otp = await (otpRoute.GET as Handler)(new Request(`${origin}/api/test/otp?email=${encodeURIComponent(email)}`), {
    params: Promise.resolve({} as never),
  });
  await who.signInWithCode(email, (await otp.json()).code);
  return who;
}

const hintIn = (response: Response) =>
  response.headers
    .getSetCookie()
    .find((cookie) => cookie.startsWith(`${visitorHintCookie}=`))
    ?.split(";")[0]
    .slice(visitorHintCookie.length + 1);

const visit = (path: string, cookies: Record<string, string>) =>
  proxy(
    new NextRequest(`${origin}${path}`, {
      headers: { cookie: Object.entries(cookies).map(([name, value]) => `${name}=${value}`).join("; ") },
    }),
  );

afterEach(() => vi.restoreAllMocks());

describe("the hint of where someone is", () => {
  it("is sent with their onboarding state, and reads back for their session only", async () => {
    const who = await guest();
    const hint = hintIn(await call(who, onboardingRoute.GET));
    expect(hint).toMatch(/^guest\.someone\.0\./);

    const session = sessionCookieOf(who.headers())!;
    expect(await readVisitorHint(session, hint)).toEqual({ kind: "guest", currentStep: "someone", completed: false });

    // Someone else's session, or a hint changed by hand, is no hint at all.
    const other = sessionCookieOf((await guest()).headers())!;
    expect(await readVisitorHint(other, hint)).toBeNull();
    expect(await readVisitorHint(session, hint!.replace("guest.someone.0", "member.everyone.1"))).toBeNull();
    expect(await readVisitorHint(session, "member.everyone.1.made-up")).toBeNull();
    expect(await readVisitorHint(session, "nonsense")).toBeNull();
  });

  it("moves with them as they save a step", async () => {
    const who = await guest();
    const saved = await call(who, onboardingRoute.POST, "POST", {
      step: "someone",
      input: { name: "Mary", relationship: "daughter" },
    });
    expect(saved.status).toBe(200);
    expect(hintIn(saved)).toMatch(/^guest\.message\.0\./);
  });

  it("lets the routing guard decide without asking the database", async () => {
    const lookups = vi.spyOn(globalThis, "fetch");
    const session = "made-up-session.signature";
    const hint = await signVisitorHint(session, { kind: "guest", currentStep: "message", completed: false });
    const cookies = { "afterbox.session_token": session, [visitorHintCookie]: hint };

    // Ahead of where they are: back to their step. Back is fine.
    expect((await visit("/start/find", cookies)).headers.get("location")).toBe(`${origin}/start/message`);
    expect((await visit("/start/someone", cookies)).headers.get("location")).toBeNull();
    expect(lookups).not.toHaveBeenCalled();
  });

  it("is asked for afresh when the hint isn't for this session", async () => {
    const lookups = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(Response.json({ kind: "guest", currentStep: "message", completed: false }));
    const hint = await signVisitorHint("an-earlier-session", { kind: "member", currentStep: "everyone", completed: true });

    const response = await visit("/home", { "afterbox.session_token": "this-session", [visitorHintCookie]: hint });
    expect(lookups).toHaveBeenCalledTimes(1);
    expect(response.headers.get("location")).toBe(`${origin}/start/message`);
    // And the answer is kept, signed for this session.
    expect(await readVisitorHint("this-session", hintIn(response))).toEqual({
      kind: "guest",
      currentStep: "message",
      completed: false,
    });
  });

  it("goes when the session does", async () => {
    const response = await visit("/start/someone", { [visitorHintCookie]: "guest.message.0.whatever" });
    expect(response.headers.getSetCookie().some((cookie) => cookie.startsWith(`${visitorHintCookie}=;`))).toBe(true);
  });
});

describe("a session ended elsewhere", () => {
  it("can't change anything, from the moment it ends", async () => {
    const email = `ended${++n}@example.com`;
    const laptop = await signedIn(email);
    const phone = await signedIn(email);
    // The laptop has the session's cookie copy, so a read alone wouldn't ask the database.
    expect((await call(laptop, peopleRoute.GET)).status).toBe(200);

    expect((await phone.post("/api/auth/revoke-sessions")).status).toBe(200);

    const attempt = await call(laptop, peopleRoute.POST, "POST", { name: "Mary", relationship: "daughter" });
    expect(attempt.status).toBe(401);
  });
});
