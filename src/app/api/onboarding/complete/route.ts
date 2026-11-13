import { route, stateResponse } from "@/server/api";
import { env } from "@/server/env";
import { completeOnboarding, getOnboardingState } from "@/server/services/onboarding";

/** The last screen: onboarding is done, and /home is theirs. Safe to call again. */
export const POST = route(async ({ request, user, db }) => {
  const progress = await completeOnboarding(db, user);
  return stateResponse(request, await getOnboardingState(db, user, env().googleEnabled, progress));
});
