import { z } from "zod";
import { route } from "@/server/api";
import { notFound } from "@/server/errors";
import { deletePracticalItem } from "@/server/services/practical";

export const DELETE = route<{ id: string }>(async ({ params, user, db }) => {
  if (!z.uuid().safeParse(params.id).success) throw notFound("that");
  await deletePracticalItem(db, user.id, params.id);
});
