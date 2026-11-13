import { z } from "zod";
import { personUpdateSchema } from "@/lib/schemas";
import { body, route } from "@/server/api";
import { notFound } from "@/server/errors";
import { deletePerson, updatePerson } from "@/server/services/people";

type Params = { id: string };

/** Anything that isn't an id is simply not found. */
const personId = (id: string) => {
  if (!z.uuid().safeParse(id).success) throw notFound("that person");
  return id;
};

/** Change their name, relationship, or how to reach them. */
export const PATCH = route<Params>(async ({ request, params, user, db }) => {
  const input = await body(request, personUpdateSchema);
  return { person: await updatePerson(db, user.id, personId(params.id), input) };
});

/** Remove someone, with the gifts made for them and their recordings. */
export const DELETE = route<Params>(async ({ params, user, db, store }) => {
  const { storagePaths } = await deletePerson(db, user.id, personId(params.id));
  // The files, once nothing points at them. If this fails, nothing can reach them anyway.
  if (storagePaths.length > 0) await (await store()).remove(storagePaths).catch(() => {});
});
