import { z } from "zod";
import { steps } from "./onboarding";
import { looksLikeSecret, noNumbersMessage } from "./no-numbers";

/**
 * What the API accepts and returns: the zod schemas and their types, shared by
 * the route handlers (which check every request with them) and the browser
 * (which is typed by them). Messages are written to be shown to the person.
 */

// ── People ──────────────────────────────────────────────────────────────────

/** How they're related, as offered on the "Who came to mind?" screen. */
export const relationships = [
  "partner",
  "daughter",
  "son",
  "mum",
  "dad",
  "sister",
  "brother",
  "friend",
  "someone-else",
] as const;
export type Relationship = (typeof relationships)[number];

const blankToNull = (value: unknown) => (typeof value === "string" && value.trim() === "" ? null : value);

const name = z
  .string({ error: "Tell us their name." })
  .trim()
  .min(1, "Tell us their name.")
  .max(60, "That's a little long. A first name is enough.");

const contactEmail = z.preprocess(
  blankToNull,
  z.email("That email address doesn't look right.").max(254).nullable(),
);
const contactPhone = z.preprocess(
  blankToNull,
  z
    .string()
    .trim()
    .regex(/^\+?[\d\s().-]{7,20}$/, "That phone number doesn't look right.")
    .nullable(),
);
const birthday = z.preprocess(
  blankToNull,
  z.iso.date("Use a date like 1994-06-21.").nullable(),
);

export const personCreateSchema = z.object({
  name,
  relationship: z.enum(relationships, "Choose how they're related."),
  email: contactEmail.optional(),
  phone: contactPhone.optional(),
  birthday: birthday.optional(),
});
export type PersonCreate = z.infer<typeof personCreateSchema>;

export const personUpdateSchema = personCreateSchema.partial();
export type PersonUpdate = z.infer<typeof personUpdateSchema>;

export type Person = {
  id: string;
  name: string;
  relationship: Relationship;
  email: string | null;
  phone: string | null;
  birthday: string | null;
  createdAt: string;
};

// ── Gifts: voice notes and letters. No video. ───────────────────────────────

export const giftKinds = ["voice", "letter"] as const;
export type GiftKind = (typeof giftKinds)[number];

/** What a recording may be. The recorder, the upload check and the bucket all read these. */
export const recordingRules = {
  /** Base types, without codec parameters, and the file extension each is stored under. */
  types: {
    "audio/webm": "webm",
    "audio/ogg": "ogg",
    "audio/mp4": "m4a",
    "audio/x-m4a": "m4a",
    "audio/m4a": "m4a",
  } as Record<string, string>,
  maxSeconds: 180,
  maxBytes: 10 * 1024 * 1024,
} as const;

/** "audio/webm;codecs=opus" → "audio/webm". */
export const baseContentType = (contentType: string) => contentType.split(";")[0].trim().toLowerCase();

const contentType = z
  .string({ error: "We couldn't tell what kind of recording that is." })
  .transform(baseContentType)
  .refine((type) => type in recordingRules.types, "We can only keep voice recordings (webm, ogg or m4a).");

const durationSeconds = z
  .number({ error: "We couldn't tell how long that recording is." })
  .int("We couldn't tell how long that recording is.")
  .min(1, "That recording is too short to keep. Try again?")
  .max(recordingRules.maxSeconds, "Voice notes can be up to 3 minutes. Try a shorter one, or write a letter.");

const sizeBytes = z
  .number({ error: "We couldn't tell how big that recording is." })
  .int()
  .min(1, "That recording is empty. Try again?")
  .max(recordingRules.maxBytes, "That recording is too big to keep (the limit is 10 MB). Try a shorter one.");

const envelopeTitle = z
  .string({ error: "Give the envelope a name." })
  .trim()
  .min(1, "Give the envelope a name.")
  .max(80, "That's a little long for an envelope.");

const letterText = z
  .string({ error: "Write a few words first." })
  .trim()
  .min(1, "Write a few words first.")
  .max(20_000, "That's a very long letter. Could it be two?");

const id = z.uuid("We couldn't find that.");

export const uploadRequestSchema = z.object({ contentType, sizeBytes, durationSeconds });
export type UploadRequest = z.input<typeof uploadRequestSchema>;
export type UploadTicket = {
  /** Where the browser sends the recording, with PUT. Short-lived. */
  uploadUrl: string;
  /** The path to send back when creating the gift. */
  storagePath: string;
  /** The Content-Type header to send with it. */
  contentType: string;
};

/** A voice note, once its recording has been uploaded. */
export const voiceMessageSchema = z.object({
  kind: z.literal("voice"),
  envelopeTitle,
  storagePath: z.string().min(1).max(200),
  durationSeconds,
});
export const letterMessageSchema = z.object({
  kind: z.literal("letter"),
  envelopeTitle,
  letterText,
});
/** What the "Say something to them" screen saves. */
export const messageSchema = z.discriminatedUnion("kind", [voiceMessageSchema, letterMessageSchema]);
export type MessageInput = z.infer<typeof messageSchema>;

const forPerson = {
  personId: id,
  /** Re-record: the gift this one takes the place of. */
  replaces: id.optional(),
};
export const giftCreateSchema = z.discriminatedUnion("kind", [
  voiceMessageSchema.extend(forPerson),
  letterMessageSchema.extend(forPerson),
]);
export type GiftCreate = z.infer<typeof giftCreateSchema>;

export type Gift = {
  id: string;
  personId: string;
  kind: GiftKind;
  envelopeTitle: string;
  /** Letters only. A voice note is played through a short-lived link instead. */
  letterText: string | null;
  durationSeconds: number | null;
  sealedAt: string;
};

// ── What they'll need to find ───────────────────────────────────────────────

export const practicalCategories = ["bank", "insurance", "pension", "property", "crypto", "wish", "other"] as const;
export type PracticalCategory = (typeof practicalCategories)[number];

const providerName = z
  .string({ error: "Tell us the name." })
  .trim()
  .min(1, "Tell us the name.")
  .max(80, "That's a little long. Just the name is enough.")
  .refine((value) => !looksLikeSecret(value), noNumbersMessage);

const note = z.preprocess(
  blankToNull,
  z
    .string()
    .trim()
    .max(500, "That's a little long for a note.")
    .refine((value) => !looksLikeSecret(value, { allowYears: true }), noNumbersMessage)
    .nullable(),
);

export const practicalItemCreateSchema = z.object({
  category: z.enum(practicalCategories, "Choose what kind of thing this is."),
  providerName,
  note: note.optional(),
});
export type PracticalItemCreate = z.infer<typeof practicalItemCreateSchema>;

export type PracticalItem = {
  id: string;
  category: PracticalCategory;
  providerName: string;
  note: string | null;
  createdAt: string;
};

// ── Preferences ─────────────────────────────────────────────────────────────

export const themes = ["light", "dark", "system"] as const;
export type Theme = (typeof themes)[number];

export const preferenceUpdateSchema = z
  .object({
    theme: z.enum(themes, "Choose light, dark or system."),
    reminderEmails: z.boolean("Choose on or off."),
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, "Nothing to change.");
export type PreferenceUpdate = z.infer<typeof preferenceUpdateSchema>;
export type Preference = { theme: Theme; reminderEmails: boolean };
export const defaultPreference: Preference = { theme: "system", reminderEmails: true };

// ── Plan ────────────────────────────────────────────────────────────────────

export const planChoices = ["free", "paid_interest"] as const;
export type PlanChoice = (typeof planChoices)[number];
export const planChoiceSchema = z.object({ choice: z.enum(planChoices, "Choose one of the two.") });

// ── Onboarding ──────────────────────────────────────────────────────────────

/** One entry per step: what that screen saves. Saving a step again replaces what it saved before. */
export const stepInputs = {
  someone: z.object({ name, relationship: z.enum(relationships, "Choose how they're related.") }),
  message: messageSchema,
  "keep-safe": z.object({}),
  /** Both optional. Nothing at all means "add later". */
  reach: z.object({ email: contactEmail.optional(), phone: contactPhone.optional() }),
  /** No name means "skip for now". */
  find: z.object({ providerName: providerName.optional() }),
  nudges: z.object({ reminderEmails: z.boolean("Choose on or off.") }),
  everyone: planChoiceSchema,
} as const;

export const saveStepSchema = z.object({
  step: z.enum(steps, "We don't know that step."),
  /** Checked against the step's own schema once the step is known. */
  input: z.unknown().optional(),
});

/** What the onboarding screens are given: who is here and everything they have made so far. */
export type OnboardingState = {
  /** `name` is how they sign their gifts ("from Dad"), once they have said. */
  user: { isGuest: boolean; email: string | null; name: string | null } | null;
  currentStep: (typeof steps)[number];
  completed: boolean;
  person: Person | null;
  /** The message sealed in onboarding, if there is one yet. */
  gift: Gift | null;
  /** The bank added in onboarding, if any. */
  bank: PracticalItem | null;
  preference: Preference;
  planChoice: PlanChoice | null;
  googleEnabled: boolean;
};

/** How they sign their gifts: "Dad", "Mum", "Grandpa Joe". */
export const signOffSchema = z.object({
  name: z.string().trim().max(40, "That's a little long. A first name, or what they call you, is enough."),
});

// ── Errors ──────────────────────────────────────────────────────────────────

export type ApiErrorCode =
  | "unauthenticated"
  | "invalid_input"
  | "not_found"
  | "upgrade_required"
  | "sign_up_required"
  | "step_not_reached"
  | "upload_invalid"
  | "too_many_requests"
  | "server_error";

export type ApiErrorBody = {
  error: {
    code: ApiErrorCode;
    /** A plain sentence, safe to show. */
    message: string;
    /** For invalid input: the first problem with each field. */
    fields?: Record<string, string>;
  };
};
