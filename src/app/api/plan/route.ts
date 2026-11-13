import { planChoiceSchema } from "@/lib/schemas";
import { body, json, route } from "@/server/api";
import { latestPlanChoice, recordPlanChoice } from "@/server/services/plan";

/** Their latest choice on the offer, or null. */
export const GET = route(async ({ user, db }) => ({ choice: await latestPlanChoice(db, user.id) }));

/**
 * Record a choice: "free", or "paid_interest" to save their place. No payments
 * yet, and nothing is ever taken away because of the plan.
 */
export const POST = route(async ({ request, user, db }) => {
  const { choice } = await body(request, planChoiceSchema);
  return json(await recordPlanChoice(db, user.id, choice), 201);
});
