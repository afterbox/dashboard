import { personCreateSchema } from "@/lib/schemas";
import { body, json, route } from "@/server/api";
import { createPerson, listPeople } from "@/server/services/people";

/** The people they love, oldest first. */
export const GET = route(async ({ user, db }) => ({ people: await listPeople(db, user.id) }));

/**
 * Add someone. On the free plan a second person is answered with 402
 * `upgrade_required`, which the UI turns into the offer.
 */
export const POST = route(async ({ request, user, db }) => {
  const input = await body(request, personCreateSchema);
  return json({ person: await createPerson(db, user.id, input) }, 201);
});
