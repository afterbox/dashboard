import { NextResponse, type NextRequest } from "next/server";
import { homeHintCookie } from "@/lib/hints";
import { redirectFor, type Visitor } from "@/lib/onboarding";
import {
  readVisitorHint,
  sessionCookieOf,
  signVisitorHint,
  visitorHintCookie,
  visitorHintSetCookie,
} from "@/server/visitor-hint";

/**
 * The routing guard (Next.js 16's Proxy). It sends people where they belong
 * before a page renders; the rules themselves are in src/lib/onboarding.ts:
 *
 * - no session, or onboarding not finished → /start/<their saved step>
 * - onboarding finished → /home (from /start and /signin too)
 *
 * This is a first look, not the lock. Every /api route checks the session
 * again, and every query filters by its owner.
 *
 * Where someone is comes from a signed cookie the app keeps up to date
 * (src/server/visitor-hint.ts), so moving between pages needn't touch the
 * database. Without one that is good for this session it asks our own
 * /api/visitor, once, and keeps the answer: the Proxy can run apart from the
 * rest of the app, so it doesn't open the database itself.
 */
export async function proxy(request: NextRequest) {
  const { visitor, hint } = await visitorFor(request);
  const to = redirectFor(request.nextUrl.pathname, visitor);
  const response = to ? NextResponse.redirect(new URL(to, request.url)) : NextResponse.next();

  if (hint) response.headers.append("Set-Cookie", hint);
  else if (visitor.kind === "none" && request.cookies.has(visitorHintCookie)) response.cookies.delete(visitorHintCookie);

  // A hint for the landing page, which is static: someone with gifts sees "Go to
  // your gifts". It opens nothing by itself; /home is still guarded above.
  const finished = visitor.kind !== "none" && visitor.completed;
  if (finished) {
    response.cookies.set(homeHintCookie, "1", { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 30 });
  } else if (request.cookies.has(homeHintCookie)) {
    response.cookies.delete(homeHintCookie);
  }
  return response;
}

/** Who is asking, and a new hint to keep if it had to be looked up. */
async function visitorFor(request: NextRequest): Promise<{ visitor: Visitor; hint?: string }> {
  const nobody = { visitor: { kind: "none" } as const };
  // No session cookie: nobody yet, and nothing to look up.
  const session = sessionCookieOf(request);
  if (!session) return nobody;

  const hinted = await readVisitorHint(session, request.cookies.get(visitorHintCookie)?.value);
  if (hinted) return { visitor: hinted };

  try {
    const response = await fetch(new URL("/api/visitor", request.nextUrl.origin), {
      headers: { cookie: request.headers.get("cookie") ?? "" },
      cache: "no-store",
    });
    if (!response.ok) return nobody;
    const visitor = (await response.json()) as Visitor;
    if (visitor.kind === "none") return { visitor };
    return { visitor, hint: visitorHintSetCookie(await signVisitorHint(session, visitor)) };
  } catch {
    return nobody;
  }
}

export const config = {
  matcher: ["/start", "/start/:path*", "/home", "/home/:path*", "/signin"],
};
