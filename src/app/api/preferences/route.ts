import { preferenceUpdateSchema } from "@/lib/schemas";
import { body, route } from "@/server/api";
import { getPreference, updatePreference } from "@/server/services/preferences";

/** Theme (light, dark or system) and reminder emails. */
export const GET = route(async ({ user, db }) => ({ preference: await getPreference(db, user.id) }));

/** Change one or both. */
export const PATCH = route(async ({ request, user, db }) => {
  const input = await body(request, preferenceUpdateSchema);
  return { preference: await updatePreference(db, user.id, input) };
});
