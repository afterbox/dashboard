import { and, asc, eq } from "drizzle-orm";
import {
  baseContentType,
  recordingRules,
  type Gift,
  type GiftCreate,
  type UploadTicket,
  uploadRequestSchema,
} from "@/lib/schemas";
import type { z } from "zod";
import { gift, person } from "../db/schema";
import type { Db } from "../db/types";
import { AppError, notFound } from "../errors";
import type { RecordingStore } from "../storage";

/**
 * Gifts: sealed voice notes and letters, each for one person.
 *
 * Every function takes the signed-in user's id first. A recording is only
 * ever reached through its gift row, which is checked against that id, so
 * nobody can play, replace or remove someone else's.
 */

type Row = typeof gift.$inferSelect;

export const toGift = (row: Row): Gift => ({
  id: row.id,
  personId: row.personId,
  kind: row.kind,
  envelopeTitle: row.envelopeTitle,
  letterText: row.letterText,
  durationSeconds: row.durationSeconds,
  sealedAt: row.sealedAt.toISOString(),
});

/** How long a link to play a recording works for, in seconds. */
export const playbackSeconds = 60;

/** Each person's recordings live in a folder of their own. */
const folderOf = (userId: string) => `${userId}/`;
/** The file names `requestUpload` gives out: a random id and one of the allowed extensions. */
const issuedName = new RegExp(
  `^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.(?:${[...new Set(Object.values(recordingRules.types))].join("|")})$`,
);

/**
 * Before anything is uploaded: check what it claims to be (audio, at most
 * 3 minutes and 10 MB), then hand back a signed URL for one new path inside
 * this person's own folder.
 */
export async function requestUpload(
  store: RecordingStore,
  userId: string,
  input: z.output<typeof uploadRequestSchema>,
): Promise<UploadTicket> {
  const extension = recordingRules.types[input.contentType];
  const storagePath = `${folderOf(userId)}${crypto.randomUUID()}.${extension}`;
  const uploadUrl = await store.createUploadUrl(storagePath);
  return { uploadUrl, storagePath, contentType: input.contentType };
}

const uploadInvalid = (message: string) => new AppError("upload_invalid", message);

/** Postgres refused a duplicate (error 23505), however the driver wrapped it. */
function isUniqueViolation(error: unknown): boolean {
  for (let e = error as { code?: unknown; cause?: unknown } | undefined; e; e = e.cause as typeof e) {
    if (e.code === "23505") return true;
  }
  return false;
}

/**
 * After the upload: check the file that actually arrived, whatever the browser
 * said about it beforehand.
 */
async function checkRecording(store: RecordingStore, userId: string, storagePath: string) {
  // Only a path we issued to them: inside their own folder, a random name, no way out of it.
  const folder = folderOf(userId);
  if (!storagePath.startsWith(folder) || !issuedName.test(storagePath.slice(folder.length))) {
    throw notFound("that recording");
  }

  const stored = await store.stat(storagePath);
  if (!stored) throw uploadInvalid("We couldn't find that recording. Try recording it again?");
  if (stored.sizeBytes < 1 || stored.sizeBytes > recordingRules.maxBytes) {
    await store.remove([storagePath]).catch(() => {});
    throw uploadInvalid("That recording is too big to keep (the limit is 10 MB). Try a shorter one.");
  }
  const contentType = baseContentType(stored.contentType ?? "");
  if (!(contentType in recordingRules.types)) {
    await store.remove([storagePath]).catch(() => {});
    throw uploadInvalid("We can only keep voice recordings (webm, ogg or m4a).");
  }
  return contentType;
}

/**
 * Seal a message for someone: a voice note (already uploaded) or a letter.
 * With `replaces`, it takes the place of an earlier one (re-record), in one
 * transaction, and the old recording is removed afterwards.
 */
export async function createGift(db: Db, store: RecordingStore, userId: string, input: GiftCreate): Promise<Gift> {
  const contentType = input.kind === "voice" ? await checkRecording(store, userId, input.storagePath) : null;

  const seal = db.transaction(async (tx) => {
    const [owner] = await tx
      .select({ id: person.id })
      .from(person)
      .where(and(eq(person.id, input.personId), eq(person.ownerId, userId)));
    if (!owner) throw notFound("that person");

    let replacedPath: string | null = null;
    if (input.replaces) {
      const [old] = await tx
        .delete(gift)
        .where(and(eq(gift.id, input.replaces), eq(gift.ownerId, userId), eq(gift.personId, input.personId)))
        .returning({ storagePath: gift.storagePath });
      if (!old) throw notFound("the message you're replacing");
      replacedPath = old.storagePath;
    }

    const [created] = await tx
      .insert(gift)
      .values(
        input.kind === "voice"
          ? {
              ownerId: userId,
              personId: input.personId,
              kind: "voice",
              envelopeTitle: input.envelopeTitle,
              storagePath: input.storagePath,
              contentType,
              durationSeconds: input.durationSeconds,
            }
          : {
              ownerId: userId,
              personId: input.personId,
              kind: "letter",
              envelopeTitle: input.envelopeTitle,
              letterText: input.letterText,
            },
      )
      .returning();
    return { created, replacedPath };
  });
  const { created, replacedPath } = await seal.catch((error) => {
    // One recording, one gift.
    if (isUniqueViolation(error)) throw uploadInvalid("That recording is already sealed. Record a new one?");
    throw error;
  });

  // The old recording, once nothing points at it. If this fails the gift is still safe.
  if (replacedPath && replacedPath !== created.storagePath) await store.remove([replacedPath]).catch(() => {});
  return toGift(created);
}

/** Their gifts, oldest first. For one person, or for everyone. */
export async function listGifts(db: Db, userId: string, personId?: string): Promise<Gift[]> {
  const rows = await db
    .select()
    .from(gift)
    .where(and(eq(gift.ownerId, userId), personId ? eq(gift.personId, personId) : undefined))
    .orderBy(asc(gift.sealedAt));
  return rows.map(toGift);
}

async function ownGift(db: Db, userId: string, giftId: string) {
  const [row] = await db
    .select()
    .from(gift)
    .where(and(eq(gift.id, giftId), eq(gift.ownerId, userId)));
  if (!row) throw notFound("that message");
  return row;
}

export async function getGift(db: Db, userId: string, giftId: string): Promise<Gift> {
  return toGift(await ownGift(db, userId, giftId));
}

/** A link to play their own voice note. It stops working after a minute. */
export async function getPlaybackUrl(db: Db, store: RecordingStore, userId: string, giftId: string) {
  const row = await ownGift(db, userId, giftId);
  if (row.kind !== "voice" || !row.storagePath) {
    throw new AppError("invalid_input", "That one is a letter, so there's nothing to play.");
  }
  return {
    url: await store.createPlaybackUrl(row.storagePath, playbackSeconds),
    contentType: row.contentType,
    expiresInSeconds: playbackSeconds,
  };
}

/** Remove a message, and its recording. */
export async function deleteGift(db: Db, store: RecordingStore, userId: string, giftId: string) {
  const [row] = await db
    .delete(gift)
    .where(and(eq(gift.id, giftId), eq(gift.ownerId, userId)))
    .returning({ storagePath: gift.storagePath });
  if (!row) throw notFound("that message");
  if (row.storagePath) await store.remove([row.storagePath]).catch(() => {});
}
