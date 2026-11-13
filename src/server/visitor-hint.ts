import "server-only";
import { getSessionCookie } from "better-auth/cookies";
import { isStep, type Visitor } from "@/lib/onboarding";
import type { OnboardingState } from "@/lib/schemas";
import { env } from "./env";

/**
 * Where someone is in onboarding, kept in a cookie for the routing guard
 * (src/proxy.ts), so moving between pages doesn't ask the database each time.
 *
 * It is signed with the app's secret and tied to one session: a hint from an
 * earlier session, or one that was changed by hand, is ignored and the guard
 * asks the database instead. Like the guard itself it opens nothing: every
 * route checks the session again.
 *
 * Its value: `<guest|member>.<step>.<0|1 finished>.<signature>`.
 *
 * Shared with the Proxy, which can run apart from the rest of the app, so this
 * file only uses the Web Crypto API.
 */
export const visitorHintCookie = "afterbox.where";

const cookieOptions = { cookiePrefix: "afterbox" };

/** The session cookie this request carries, as sent. */
export const sessionCookieOf = (request: Request | Headers) => getSessionCookie(request, cookieOptions);

let key: Promise<CryptoKey> | undefined;
const signingKey = () =>
  (key ??= crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(`afterbox visitor hint\u0000${env().BETTER_AUTH_SECRET}`),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  ));

const base64url = (bytes: ArrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

async function signature(session: string, body: string) {
  return base64url(await crypto.subtle.sign("HMAC", await signingKey(), new TextEncoder().encode(`${session}\u0000${body}`)));
}

/** Compared in full whatever the input, so the time taken says nothing about the signature. */
function same(a: string, b: string) {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return difference === 0;
}

type Known = Exclude<Visitor, { kind: "none" }>;

export async function signVisitorHint(session: string, visitor: Known): Promise<string> {
  const body = `${visitor.kind}.${visitor.currentStep}.${visitor.completed ? 1 : 0}`;
  return `${body}.${await signature(session, body)}`;
}

/** The visitor the hint describes, or null if it isn't one we signed for this session. */
export async function readVisitorHint(session: string, value: string | undefined): Promise<Known | null> {
  if (!value) return null;
  const parts = value.split(".");
  if (parts.length !== 4) return null;
  const [kind, currentStep, completed, signed] = parts;
  if ((kind !== "guest" && kind !== "member") || !isStep(currentStep) || (completed !== "0" && completed !== "1")) {
    return null;
  }
  if (!same(signed, await signature(session, `${kind}.${currentStep}.${completed}`))) return null;
  return { kind, currentStep, completed: completed === "1" };
}

/** The Set-Cookie line for a hint: as long-lived as the session, never readable by the page. */
export function visitorHintSetCookie(value: string) {
  const secure = env().production ? "; Secure" : "";
  return `${visitorHintCookie}=${value}; Path=/; Max-Age=${60 * 60 * 24 * 30}; HttpOnly; SameSite=Lax${secure}`;
}

/**
 * The hint for whoever made this request, from the onboarding state about to
 * be sent back. Null when there is nothing to sign it to: no session cookie
 * came with the request (a guest session that is only now beginning).
 */
export async function visitorHintFor(request: Request, state: OnboardingState): Promise<string | null> {
  const session = sessionCookieOf(request);
  if (!session || !state.user) return null;
  const value = await signVisitorHint(session, {
    kind: state.user.isGuest ? "guest" : "member",
    currentStep: state.currentStep,
    completed: state.completed,
  });
  return visitorHintSetCookie(value);
}
