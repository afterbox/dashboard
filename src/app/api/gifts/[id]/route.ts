import { z } from "zod";
import { route } from "@/server/api";
import { notFound } from "@/server/errors";
import { deleteGift } from "@/server/services/gifts";

/** Remove one of their own messages, and its recording. */
export const DELETE = route<{ id: string }>(async ({ params, user, db, store }) => {
  if (!z.uuid().safeParse(params.id).success) throw notFound("that message");
  await deleteGift(db, await store(), user.id, params.id);
});
