import { z } from "zod";
import { giftCreateSchema } from "@/lib/schemas";
import { body, json, route } from "@/server/api";
import { notFound } from "@/server/errors";
import { createGift, listGifts } from "@/server/services/gifts";

/** Their gifts, oldest first. `?personId=` for one person's. */
export const GET = route(async ({ request, user, db }) => {
  const personId = new URL(request.url).searchParams.get("personId") ?? undefined;
  if (personId && !z.uuid().safeParse(personId).success) throw notFound("that person");
  return { gifts: await listGifts(db, user.id, personId) };
});

/**
 * Seal a message for someone: a voice note (after its recording has been
 * uploaded) or a letter. With `replaces`, it takes the place of an earlier one.
 */
export const POST = route(async ({ request, user, db, store }) => {
  const input = await body(request, giftCreateSchema);
  return json({ gift: await createGift(db, await store(), user.id, input) }, 201);
});
