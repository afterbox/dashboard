import "server-only";
import { getAuth } from "./auth";
import { AppError } from "./errors";
import type { SessionUser } from "./services/onboarding";

export type SessionCheck = {
  user: SessionUser | null;
  /** Cookies to pass back to the browser: the session's short-lived copy, renewed. */
  setCookies: string[];
};

/**
 * Who is asking.
 *
 * Reads may trust the session's signed copy in a cookie, which lasts a couple
 * of minutes (see `cookieCache` in ./auth-config.ts), so most requests skip the
 * database. Anything that changes something is `fresh`: the session is checked
 * against the database, so a session ended elsewhere ("sign out everywhere")
 * can't change anything, from the moment it ends.
 *
 * The routing guard (src/proxy.ts) is only a first look; every route asks again here.
 */
export async function checkSession(headers: Headers, { fresh = false } = {}): Promise<SessionCheck> {
  const auth = await getAuth();
  const { headers: sent, response } = await auth.api.getSession({
    headers,
    query: { disableCookieCache: fresh },
    returnHeaders: true,
  });
  const setCookies = sent.getSetCookie();
  if (!response) return { user: null, setCookies };
  const { id, email, name, isAnonymous } = response.user;
  return { user: { id, isAnonymous: Boolean(isAnonymous), email, name }, setCookies };
}

/** As above, always checked against the database. */
export async function getSessionUser(headers: Headers): Promise<SessionUser | null> {
  return (await checkSession(headers, { fresh: true })).user;
}

/** As above, or a 401 the browser can act on. */
export async function requireSessionUser(headers: Headers): Promise<SessionUser> {
  const user = await getSessionUser(headers);
  if (!user) throw new AppError("unauthenticated", "Let's start again: your session has ended.");
  return user;
}
