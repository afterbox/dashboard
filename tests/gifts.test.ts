import { eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { giftCreateSchema, giftKinds, recordingRules, uploadRequestSchema, type Person } from "@/lib/schemas";
import { gift } from "@/server/db/schema";
import type { Db } from "@/server/db/types";
import { AppError } from "@/server/errors";
import {
  createGift,
  deleteGift,
  getGift,
  getPlaybackUrl,
  listGifts,
  playbackSeconds,
  requestUpload,
} from "@/server/services/gifts";
import type { SessionUser } from "@/server/services/onboarding";
import { createPerson } from "@/server/services/people";
import { addUser, fakeStore, testDb, type FakeStore } from "./helpers";

let db: Db;
let close: () => Promise<void>;
let store: FakeStore;
let dad: SessionUser;
let mary: Person;
let stranger: SessionUser;

beforeAll(async () => {
  ({ db, close } = await testDb());
});
afterAll(() => close());

beforeEach(async () => {
  store = fakeStore();
  dad = await addUser(db);
  stranger = await addUser(db);
  mary = await createPerson(db, dad.id, { name: "Mary", relationship: "daughter" });
});

const refusal = async (promise: Promise<unknown>) => {
  const error = await promise.then(
    () => null,
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(AppError);
  return error as AppError;
};

const okUpload = { contentType: "audio/webm;codecs=opus", sizeBytes: 480_000, durationSeconds: 42 };

/** Ask for an upload URL, then "upload" to it. */
async function record(owner: SessionUser, file?: { sizeBytes?: number; contentType?: string | null }) {
  const ticket = await requestUpload(store, owner.id, uploadRequestSchema.parse(okUpload));
  store.put(ticket.storagePath, file);
  return ticket.storagePath;
}

const voiceFor = (personId: string, storagePath: string) =>
  ({ kind: "voice", personId, envelopeTitle: "For Mary, on a hard day", storagePath, durationSeconds: 42 }) as const;

describe("recordings: what may be uploaded", () => {
  it("issues a signed upload URL for a new path in their own folder", async () => {
    const ticket = await requestUpload(store, dad.id, uploadRequestSchema.parse(okUpload));
    expect(ticket.storagePath).toMatch(new RegExp(`^${dad.id}/[0-9a-f-]{36}\\.webm$`));
    expect(ticket.uploadUrl).toContain(ticket.storagePath);
    // Codec parameters are dropped: the base type is what is checked and stored.
    expect(ticket.contentType).toBe("audio/webm");

    const again = await requestUpload(store, dad.id, uploadRequestSchema.parse(okUpload));
    expect(again.storagePath).not.toBe(ticket.storagePath);
  });

  it.each([
    ["audio/webm", "webm"],
    ["audio/ogg; codecs=opus", "ogg"],
    ["audio/mp4", "m4a"],
    ["audio/x-m4a", "m4a"],
  ])("accepts %s", async (contentType, extension) => {
    const ticket = await requestUpload(store, dad.id, uploadRequestSchema.parse({ ...okUpload, contentType }));
    expect(ticket.storagePath.endsWith(`.${extension}`)).toBe(true);
  });

  it.each([
    ["video", { ...okUpload, contentType: "video/webm" }, /only keep voice recordings/],
    ["video in an mp4", { ...okUpload, contentType: "video/mp4" }, /only keep voice recordings/],
    ["an image", { ...okUpload, contentType: "image/png" }, /only keep voice recordings/],
    ["mp3", { ...okUpload, contentType: "audio/mpeg" }, /only keep voice recordings/],
    ["no type at all", { ...okUpload, contentType: undefined }, /what kind of recording/],
    ["more than 10 MB", { ...okUpload, sizeBytes: recordingRules.maxBytes + 1 }, /10 MB/],
    ["nothing at all", { ...okUpload, sizeBytes: 0 }, /empty/],
    ["more than 3 minutes", { ...okUpload, durationSeconds: 181 }, /up to 3 minutes/],
    ["no length", { ...okUpload, durationSeconds: 0 }, /too short/],
    ["a length that isn't a number", { ...okUpload, durationSeconds: "42" }, /how long/],
  ])("refuses %s, with a kind message", (_what, input, message) => {
    const result = uploadRequestSchema.safeParse(input);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toMatch(message);
  });

  it("allows exactly 3 minutes and exactly 10 MB", () => {
    expect(
      uploadRequestSchema.safeParse({ ...okUpload, durationSeconds: 180, sizeBytes: recordingRules.maxBytes }).success,
    ).toBe(true);
  });

  it("voice and letters only: there is no video", () => {
    expect(giftKinds).toEqual(["voice", "letter"]);
    expect(
      giftCreateSchema.safeParse({ kind: "video", personId: mary.id, envelopeTitle: "x", storagePath: "x" }).success,
    ).toBe(false);
  });
});

describe("sealing a voice note", () => {
  it("seals a recording that was uploaded to their own folder", async () => {
    const path = await record(dad);
    const sealed = await createGift(db, store, dad.id, voiceFor(mary.id, path));
    expect(sealed).toMatchObject({
      kind: "voice",
      personId: mary.id,
      envelopeTitle: "For Mary, on a hard day",
      durationSeconds: 42,
      letterText: null,
    });
    // Where it is stored is never part of what the browser is given.
    expect(JSON.stringify(sealed)).not.toContain(path);
    expect(await listGifts(db, dad.id, mary.id)).toEqual([sealed]);
  });

  it("checks the file that actually arrived, whatever the browser claimed", async () => {
    // Claimed small audio; sent something else.
    const tooBig = await record(dad, { sizeBytes: recordingRules.maxBytes + 1 });
    const big = await refusal(createGift(db, store, dad.id, voiceFor(mary.id, tooBig)));
    expect(big.code).toBe("upload_invalid");
    expect(big.message).toMatch(/10 MB/);
    // And it isn't left lying around.
    expect(store.files.has(tooBig)).toBe(false);

    const video = await record(dad, { contentType: "video/webm" });
    const notAudio = await refusal(createGift(db, store, dad.id, voiceFor(mary.id, video)));
    expect(notAudio.code).toBe("upload_invalid");
    expect(notAudio.message).toMatch(/only keep voice recordings/);
    expect(store.files.has(video)).toBe(false);

    const empty = await record(dad, { sizeBytes: 0 });
    expect((await refusal(createGift(db, store, dad.id, voiceFor(mary.id, empty)))).code).toBe("upload_invalid");

    expect(await listGifts(db, dad.id)).toEqual([]);
  });

  it("refuses a recording that never arrived", async () => {
    const ticket = await requestUpload(store, dad.id, uploadRequestSchema.parse(okUpload));
    const error = await refusal(createGift(db, store, dad.id, voiceFor(mary.id, ticket.storagePath)));
    expect(error.code).toBe("upload_invalid");
  });

  it("refuses more than 3 minutes at the door", () => {
    const result = giftCreateSchema.safeParse({ ...voiceFor(mary.id, `${dad.id}/x.webm`), durationSeconds: 200 });
    expect(result.success).toBe(false);
  });

  it("one recording, one gift", async () => {
    const path = await record(dad);
    await createGift(db, store, dad.id, voiceFor(mary.id, path));
    const error = await refusal(createGift(db, store, dad.id, voiceFor(mary.id, path)));
    expect(error.code).toBe("upload_invalid");
    expect(await listGifts(db, dad.id)).toHaveLength(1);
  });
});

describe("letters", () => {
  it("seals a letter", async () => {
    const sealed = await createGift(db, store, dad.id, {
      kind: "letter",
      personId: mary.id,
      envelopeTitle: "For Mary, on her wedding day",
      letterText: "I'm so proud of you.",
    });
    expect(sealed).toMatchObject({ kind: "letter", letterText: "I'm so proud of you.", durationSeconds: null });
  });

  it("needs words, and a name for the envelope", () => {
    const base = { kind: "letter", personId: mary.id, envelopeTitle: "For Mary", letterText: "Hello" };
    expect(giftCreateSchema.safeParse({ ...base, letterText: "   " }).success).toBe(false);
    expect(giftCreateSchema.safeParse({ ...base, envelopeTitle: "" }).success).toBe(false);
    expect(giftCreateSchema.safeParse(base).success).toBe(true);
  });
});

describe("ownership of gifts and recordings", () => {
  it("someone else can't seal a gift for a person who isn't theirs", async () => {
    const error = await refusal(
      createGift(db, store, stranger.id, {
        kind: "letter",
        personId: mary.id,
        envelopeTitle: "For Mary",
        letterText: "From a stranger",
      }),
    );
    expect(error.code).toBe("not_found");
    expect(await listGifts(db, dad.id)).toEqual([]);
  });

  it("someone else can't claim a recording from another folder", async () => {
    const dadsRecording = await record(dad);
    const theirs = await createPerson(db, stranger.id, { name: "Ana", relationship: "partner" });

    const error = await refusal(createGift(db, store, stranger.id, voiceFor(theirs.id, dadsRecording)));
    expect(error.code).toBe("not_found");
    // The file is untouched, and nothing points at it from their account.
    expect(store.files.has(dadsRecording)).toBe(true);
    expect(await listGifts(db, stranger.id)).toEqual([]);
  });

  it.each([
    "../other/recording.webm",
    "/etc/passwd",
    "recording.webm",
    "{own}/../{other}/00000000-0000-4000-8000-000000000000.webm",
    "{own}/sub/00000000-0000-4000-8000-000000000000.webm",
    "{own}/00000000-0000-4000-8000-000000000000.exe",
    "{own}/00000000-0000-4000-8000-000000000000.webm/../../x",
  ])("refuses a path it didn't issue: %s", async (template) => {
    const path = template.replace("{own}", dad.id).replace("{other}", stranger.id);
    store.put(path);
    const error = await refusal(createGift(db, store, dad.id, voiceFor(mary.id, path)));
    expect(error.code).toBe("not_found");
  });

  it("someone else can't read, play, replace or remove a gift", async () => {
    const path = await record(dad);
    const sealed = await createGift(db, store, dad.id, voiceFor(mary.id, path));
    const theirs = await createPerson(db, stranger.id, { name: "Ana", relationship: "partner" });

    expect(await listGifts(db, stranger.id)).toEqual([]);
    expect(await listGifts(db, stranger.id, mary.id)).toEqual([]);

    for (const attempt of [
      getGift(db, stranger.id, sealed.id),
      getPlaybackUrl(db, store, stranger.id, sealed.id),
      deleteGift(db, store, stranger.id, sealed.id),
      // Re-record, pointed at someone else's gift.
      createGift(db, store, stranger.id, {
        kind: "letter",
        personId: theirs.id,
        envelopeTitle: "Mine now",
        letterText: "x",
        replaces: sealed.id,
      }),
    ]) {
      const error = await refusal(attempt);
      expect(error.code).toBe("not_found");
      expect(error.status).toBe(404);
    }

    // No link was ever made for them, and the gift and its recording are untouched.
    expect(store.playbackUrls).toEqual([]);
    expect(store.files.has(path)).toBe(true);
    expect(await getGift(db, dad.id, sealed.id)).toEqual(sealed);
    expect(await listGifts(db, stranger.id)).toEqual([]);
  });
});

describe("playing back and re-recording their own", () => {
  it("plays their own voice note through a short-lived link", async () => {
    const path = await record(dad);
    const sealed = await createGift(db, store, dad.id, voiceFor(mary.id, path));

    const playback = await getPlaybackUrl(db, store, dad.id, sealed.id);
    expect(playback.url).toContain("token=");
    expect(playback.expiresInSeconds).toBe(playbackSeconds);
    expect(playbackSeconds).toBeLessThanOrEqual(120);
    expect(store.playbackUrls).toEqual([{ path, expiresInSeconds: playbackSeconds }]);
  });

  it("a letter has nothing to play", async () => {
    const letter = await createGift(db, store, dad.id, {
      kind: "letter",
      personId: mary.id,
      envelopeTitle: "For Mary",
      letterText: "Hello.",
    });
    expect((await refusal(getPlaybackUrl(db, store, dad.id, letter.id))).code).toBe("invalid_input");
  });

  it("re-recording takes the place of the old one, and removes the old recording", async () => {
    const first = await record(dad);
    const original = await createGift(db, store, dad.id, voiceFor(mary.id, first));

    const second = await record(dad);
    const replaced = await createGift(db, store, dad.id, { ...voiceFor(mary.id, second), replaces: original.id });

    expect(replaced.id).not.toBe(original.id);
    expect(await listGifts(db, dad.id, mary.id)).toEqual([replaced]);
    expect(store.files.has(first)).toBe(false);
    expect(store.files.has(second)).toBe(true);
  });

  it("if the new recording is refused, the old one is kept", async () => {
    const first = await record(dad);
    const original = await createGift(db, store, dad.id, voiceFor(mary.id, first));

    const bad = await record(dad, { contentType: "video/webm" });
    await refusal(createGift(db, store, dad.id, { ...voiceFor(mary.id, bad), replaces: original.id }));

    expect(await listGifts(db, dad.id, mary.id)).toEqual([original]);
    expect(store.files.has(first)).toBe(true);
  });

  it("removing a gift removes its recording", async () => {
    const path = await record(dad);
    const sealed = await createGift(db, store, dad.id, voiceFor(mary.id, path));
    await deleteGift(db, store, dad.id, sealed.id);
    expect(store.files.has(path)).toBe(false);
    expect(await db.select().from(gift).where(eq(gift.id, sealed.id))).toEqual([]);
  });
});
