import { z } from "zod";
import { route } from "@/server/api";
import { notFound } from "@/server/errors";
import { getPlaybackUrl } from "@/server/services/gifts";

/** A link to play their own voice note. It stops working after a minute. */
export const GET = route<{ id: string }>(async ({ params, user, db, store }) => {
  if (!z.uuid().safeParse(params.id).success) throw notFound("that message");
  return getPlaybackUrl(db, await store(), user.id, params.id);
});
