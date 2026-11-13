import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";
import { homeHintCookie } from "@/lib/hints";
import { redirectFor, type Visitor } from "@/lib/onboarding";

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
 * It asks our own /api/visitor rather than opening the database here: the
 * Proxy can run apart from the rest of the app, so it shares nothing with it.
 */
export async function proxy(request: NextRequest) {
  const visitor = await visitorFor(request);
  const to = redirectFor(request.nextUrl.pathname, visitor);
  const response = to ? NextResponse.redirect(new URL(to, request.url)) : NextResponse.next();

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

async function visitorFor(request: NextRequest): Promise<Visitor> {
  // No session cookie: nobody yet, and nothing to look up.
  if (!getSessionCookie(request, { cookiePrefix: "afterbox" })) return { kind: "none" };
  try {
    const response = await fetch(new URL("/api/visitor", request.nextUrl.origin), {
      headers: { cookie: request.headers.get("cookie") ?? "" },
      cache: "no-store",
    });
    if (!response.ok) return { kind: "none" };
    return (await response.json()) as Visitor;
  } catch {
    return { kind: "none" };
  }
}

export const config = {
  matcher: ["/start", "/start/:path*", "/home", "/home/:path*", "/signin"],
};
