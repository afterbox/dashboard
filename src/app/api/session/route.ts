import { getAuth } from "@/server/auth";
import { json, openRoute, stateResponse } from "@/server/api";
import { env } from "@/server/env";
import { getOnboardingState } from "@/server/services/onboarding";

/** Who is here, and everything onboarding has saved for them so far. */
export const GET = openRoute(async ({ request, user, db }) =>
  stateResponse(request, await getOnboardingState(db, user, env().googleEnabled)),
);

/**
 * Begin: give this visitor a guest session, so what they make is kept from the
 * first screen. If they already have a session (guest or not), nothing changes.
 */
export const POST = openRoute(async ({ request, user, db }) => {
  const { googleEnabled } = env();
  if (user) return stateResponse(request, await getOnboardingState(db, user, googleEnabled));

  const auth = await getAuth();
  const signedIn = await auth.api.signInAnonymous({ headers: request.headers, returnHeaders: true });
  const guest = signedIn.response?.user;
  if (!guest) throw new Error("A guest session couldn't be started.");

  const response = json(
    await getOnboardingState(db, { id: guest.id, isAnonymous: true, email: null, name: null }, googleEnabled),
    201,
  );
  // The session cookie Better Auth made (httpOnly; Secure in production).
  for (const cookie of signedIn.headers.getSetCookie()) response.headers.append("Set-Cookie", cookie);
  return response;
});
