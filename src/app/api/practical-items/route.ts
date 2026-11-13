import { practicalItemCreateSchema } from "@/lib/schemas";
import { body, json, route } from "@/server/api";
import { createPracticalItem, listPracticalItems } from "@/server/services/practical";

/** "What they'll need to find", oldest first. */
export const GET = route(async ({ user, db }) => ({ items: await listPracticalItems(db, user.id) }));

/**
 * Add one: where something is, never the keys to it. Anything that looks like
 * an account number, sort code, card number, PIN or password is refused, kindly.
 */
export const POST = route(async ({ request, user, db }) => {
  const input = await body(request, practicalItemCreateSchema);
  return json({ item: await createPracticalItem(db, user.id, input) }, 201);
});
