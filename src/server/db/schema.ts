import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import type { Step } from "@/lib/onboarding";
import type { GiftKind, PlanChoice, PracticalCategory, Relationship, Theme } from "@/lib/schemas";

/**
 * The database (Supabase Postgres), in one file.
 *
 * Two rules for every table here:
 *
 * 1. `.enableRLS()`, and no policies. Supabase exposes `public` tables through
 *    its Data API; Row Level Security with no policy means the public keys can
 *    read nothing. The app connects as the database owner, which RLS does not
 *    restrict. tests/rls.test.ts fails if a table is added without it.
 *
 * 2. Every row has an owner, and every query filters by them (src/server/services).
 *
 * After changing this file: `npm run db:generate`, commit the new file in
 * drizzle/, then `npm run db:migrate`.
 */

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () => timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();

// ── Better Auth ─────────────────────────────────────────────────────────────
// The property names are Better Auth's field names; it reads and writes these
// tables through its Drizzle adapter (src/server/auth.ts).

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  /** A guest: made on the first screen, before we ask who they are. Linked to a real account at sign-up. */
  isAnonymous: boolean("is_anonymous").default(false),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}).enableRLS();

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [index("session_user_id_idx").on(table.userId)],
).enableRLS();

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [index("account_user_id_idx").on(table.userId)],
).enableRLS();

/** Sign-in codes (hashed) and other short-lived proofs. */
export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
).enableRLS();

/** Better Auth's own limiter: requests per IP address and path. */
export const rateLimit = pgTable("rate_limit", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  count: integer("count").notNull(),
  lastRequest: bigint("last_request", { mode: "number" }).notNull(),
}).enableRLS();

// ── afterbox ────────────────────────────────────────────────────────────────

/**
 * Someone they love. Name and relationship only at first; how to reach them is
 * always optional and can be added later.
 *
 * `restrict`, not `cascade`, on the owner: a person and their gifts are never
 * removed as a side effect of something else.
 */
export const person = pgTable(
  "person",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    relationship: text("relationship").$type<Relationship>().notNull(),
    email: text("email"),
    phone: text("phone"),
    birthday: date("birthday", { mode: "string" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [index("person_owner_id_idx").on(table.ownerId)],
).enableRLS();

/** A sealed message for one person: a voice note or a letter. No video. */
export const gift = pgTable(
  "gift",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    personId: uuid("person_id")
      .notNull()
      .references(() => person.id, { onDelete: "cascade" }),
    kind: text("kind").$type<GiftKind>().notNull(),
    /** In their own words: "For Mary, on a hard day". */
    envelopeTitle: text("envelope_title").notNull(),
    /** Voice: where the recording is in the private bucket. An opaque key; who owns it is `ownerId`. */
    storagePath: text("storage_path").unique(),
    contentType: text("content_type"),
    /** Letter: the words. */
    letterText: text("letter_text"),
    durationSeconds: integer("duration_seconds"),
    sealedAt: timestamp("sealed_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: createdAt(),
  },
  (table) => [
    index("gift_owner_id_idx").on(table.ownerId),
    index("gift_person_id_idx").on(table.personId),
    check("gift_kind_check", sql`${table.kind} in ('voice', 'letter')`),
    // A voice note has a recording and no words; a letter has words and no recording.
    check(
      "gift_content_check",
      sql`(${table.kind} = 'voice' and ${table.storagePath} is not null and ${table.letterText} is null)
        or (${table.kind} = 'letter' and ${table.letterText} is not null and ${table.storagePath} is null)`,
    ),
  ],
).enableRLS();

/**
 * One thing they'd need to find: where it is, never the keys to it. No account
 * numbers, sort codes, card numbers, PINs or passwords (src/lib/no-numbers.ts).
 */
export const practicalItem = pgTable(
  "practical_item",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    category: text("category").$type<PracticalCategory>().notNull(),
    providerName: text("provider_name").notNull(),
    note: text("note"),
    createdAt: createdAt(),
  },
  (table) => [
    index("practical_item_owner_id_idx").on(table.ownerId),
    check(
      "practical_item_category_check",
      sql`${table.category} in ('bank', 'insurance', 'pension', 'property', 'crypto', 'wish', 'other')`,
    ),
  ],
).enableRLS();

/** What each onboarding step saved, by step. Ids of what it made, so saving it again changes that rather than making another. */
export type OnboardingData = {
  someone?: { personId: string };
  message?: { giftId: string };
  reach?: { later: boolean };
  find?: { practicalItemId: string | null };
  nudges?: { reminderEmails: boolean };
  everyone?: { choice: PlanChoice };
};

export const onboardingProgress = pgTable("onboarding_progress", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  /** The step they are on: the first one not yet done. */
  currentStep: text("current_step").$type<Step>().notNull(),
  data: jsonb("data").$type<OnboardingData>().notNull().default({}),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  updatedAt: updatedAt(),
}).enableRLS();

export const preference = pgTable(
  "preference",
  {
    userId: text("user_id")
      .primaryKey()
      .references(() => user.id, { onDelete: "cascade" }),
    theme: text("theme").$type<Theme>().notNull().default("system"),
    reminderEmails: boolean("reminder_emails").notNull().default(true),
    updatedAt: updatedAt(),
  },
  (table) => [check("preference_theme_check", sql`${table.theme} in ('light', 'dark', 'system')`)],
).enableRLS();

/** Each time they choose on the offer. No payments yet: "paid_interest" saves their place. */
export const planInterest = pgTable(
  "plan_interest",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    choice: text("choice").$type<PlanChoice>().notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    index("plan_interest_user_id_idx").on(table.userId),
    check("plan_interest_choice_check", sql`${table.choice} in ('free', 'paid_interest')`),
  ],
).enableRLS();

/**
 * Counters for the sign-in code limits: how many times something has happened
 * for a key (an email address, hashed) since its window began.
 */
export const throttle = pgTable("throttle", {
  key: text("key").primaryKey(),
  count: integer("count").notNull(),
  windowStartedAt: timestamp("window_started_at", { withTimezone: true }).notNull(),
}).enableRLS();
