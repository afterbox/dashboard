import { route } from "@/server/api";
import { env } from "@/server/env";
import { completeOnboarding, getOnboardingState } from "@/server/services/onboarding";

/** The last screen: onboarding is done, and /home is theirs. Safe to call again. */
export const POST = route(async ({ user, db }) => {
  await completeOnboarding(db, user);
  return getOnboardingState(db, user, env().googleEnabled);
});
