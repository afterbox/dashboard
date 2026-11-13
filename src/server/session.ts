import "server-only";
import { getAuth } from "./auth";
import { AppError } from "./errors";
import type { SessionUser } from "./services/onboarding";

/**
 * Who is asking. The cookie is checked against the database every time; the
 * routing guard (src/proxy.ts) is only a first look, and every route handler
 * and page asks again here.
 */
export async function getSessionUser(headers: Headers): Promise<SessionUser | null> {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers });
  if (!session) return null;
  const { id, email, name, isAnonymous } = session.user;
  return { id, isAnonymous: Boolean(isAnonymous), email, name };
}

/** As above, or a 401 the browser can act on. */
export async function requireSessionUser(headers: Headers): Promise<SessionUser> {
  const user = await getSessionUser(headers);
  if (!user) throw new AppError("unauthenticated", "Let's start again: your session has ended.");
  return user;
}
