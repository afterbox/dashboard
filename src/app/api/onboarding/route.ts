import { saveStepSchema } from "@/lib/schemas";
import { body, openRoute, route, stateResponse } from "@/server/api";
import { env } from "@/server/env";
import { getOnboardingState, saveStep } from "@/server/services/onboarding";

/** Where they are, and what they have made so far. */
export const GET = openRoute(async ({ request, user, db }) =>
  stateResponse(request, await getOnboardingState(db, user, env().googleEnabled)),
);

/**
 * Save one step: `{ step, input }`. Does that step's work and moves them on.
 * Saving the same step again changes what it saved; it never makes a second.
 */
export const POST = route(async ({ request, user, db, store }) => {
  const { step, input } = await body(request, saveStepSchema);
  const progress = await saveStep(db, await store(), user, step, input);
  return stateResponse(request, await getOnboardingState(db, user, env().googleEnabled, progress));
});
