# afterbox — architecture (prototype)

One Next.js 16 app (App Router, `src/`). No separate server: pages, route handlers and the routing guard all live here. This page describes the first build: onboarding (`/start`), the first version of `/home`, and the backend behind them.

> **Prototype: test data only.** Recordings and letters are stored as they are (encrypted at rest by Supabase, nothing more). The promise "Not even afterbox can open your vault" is **not yet true in code**. See "Encryption" below.

## Routes

| Route | What it is |
|---|---|
| `/` | The landing page (static). Its buttons lead to `/start`; for someone signed in they read "Go to your gifts" and lead to `/home`. |
| `/start` → `/start/<step>` | Onboarding, one URL per step: `someone`, `message`, `keep-safe`, `reach`, `find`, `nudges`, `everyone` (`docs/onboarding-story.md`). There is no welcome screen: the landing page has said what this is, so `/start` opens on the first question. Each step is its own small static page (`src/app/(app)/start/<step>/page.tsx`); the order lives in `src/lib/onboarding.ts`. |
| `/home` | The app: their people as gift boxes, each person's gifts, the practical shelf. |
| `/signin` | Returning people: email code (Google once configured). |
| `/api/auth/*` | Better Auth: guest sign-in, email code send and verify, sign out, sign out everywhere. |
| `/api/session` | `POST` starts a guest session (or returns the current one). `GET` returns who is here and their onboarding state. |
| `/api/onboarding` | `GET` progress · `POST` save a step (idempotent) · `POST /api/onboarding/complete`. |
| `/api/visitor` | What the routing guard asks: nobody, a guest or a member, the step they have reached, and whether they have finished. Nothing personal. |
| `/api/people`, `/api/people/[id]` | Create, list, update, delete. A second person on the free plan answers `402 upgrade_required`. |
| `/api/gifts`, `/api/gifts/upload-url`, `/api/gifts/[id]`, `/api/gifts/[id]/playback` | Signed upload URL, create a voice gift or a letter, list by person, signed playback URL, delete or replace (re-record). |
| `/api/practical-items`, `/api/practical-items/[id]` | Create, list, delete. Names only, never numbers. |
| `/api/preferences` | Theme (`light`, `dark`, `system`) and reminder emails. |
| `/api/plan` | Records `free` or `paid_interest`. No payments yet. |
| `/api/test/*` | Test-only hooks (read a sign-in code, a stand-in for storage). They answer 404 unless `E2E_TEST_MODE=1` **and** the app is not running in production. |

**The routing guard** is `src/proxy.ts` (Next.js 16 renamed Middleware to Proxy). It runs only for `/start`, `/home` and `/signin`, looks up the session and onboarding state, and redirects before anything renders:

- no session, or a guest → the onboarding step they had reached (`/start/<saved step>`); a step further on than that sends them back to it;
- signed in, onboarding unfinished → the same, from `reach` onwards;
- onboarding finished → `/home` (from `/start` and `/signin` too).

The guard is for getting people to the right place. It is not the security boundary: every query below checks ownership again.

The Proxy can run apart from the rest of the app, so it opens no database connection of its own. It reads where someone is from a signed cookie, `afterbox.where` (`src/server/visitor-hint.ts`), which every response carrying onboarding state keeps up to date, and applies the rules in `src/lib/onboarding.ts` (`redirectFor`, which has its own tests). The cookie is signed with `BETTER_AUTH_SECRET` and tied to the session cookie, so one changed by hand, or left over from an earlier session, is ignored: then the Proxy passes the request's cookie to our own `/api/visitor`, once, and keeps the answer. With no session cookie it asks nothing, and clears the hint. Like the Proxy itself, the hint opens nothing.

It also sets a small cookie, `afterbox.home=1`, for someone who has finished onboarding (and clears it otherwise). The landing page is static, so this is how its buttons know to read "Go to your gifts": a script in `<head>` (`src/lib/hints.ts`) turns the cookie into `<html data-member>` before the first paint, and CSS shows the right words. The cookie is a hint for the words on a button and nothing else: it is not the session and opens nothing.

## How the pages work

- **The pages are static; what is personal is loaded in the browser.** `/start/*`, `/home` and `/signin` are prerendered and the same for everyone. Who is here and what they have made comes from `/api/session` (and `/api/people`, `/api/gifts`, `/api/practical-items` on `/home`), where every query is checked against the session. This keeps every step instant, and it is what lets the gift box travel between pages.
- **The store** (`src/store/`, TanStack Query) is the one place the browser holds what the server keeps: the session, people, gifts and the shelf, each fetched once and shared by every screen that reads it. There is no other global store; what a single screen needs (which sheet is open, what is being typed) stays in that screen. Components read and change things through the store's hooks, never through `fetch`.
  - **One provider** (`StoreProvider`) in the layout shared by `/start`, `/signin` and `/home` (`src/app/(app)/layout.tsx`; the brackets keep the folder out of the URLs). The landing page sits outside it and never loads it.
  - **Refreshing** (`store/client.ts`): something loaded in the last 30 seconds is reused; anything older is shown at once and refreshed behind, and again on coming back to the tab or back online. A failed read is tried twice more when the connection or our side is at fault, never when the server refused. A change refreshes its own list only: adding to the shelf asks for the shelf again, not for people or gifts.
  - **Shown before the server answers:** a new gift and anything added to or taken off the shelf appear at once. If the server refuses, the list goes back to how it was, and what they made is kept: the shelf sheet opens again with what they typed, and a message that could not be sealed stays (recording included) with a way to try again, on the person's card and in their sheet. A gift still on its way reads "Sealing…" and can't be played or replaced until the server has it. Adding a person is not shown early: on the free plan the answer may be the offer.
  - **Signed out:** if any request on `/home` comes back "not signed in", the store sends them to `/signin`. What was loaded is forgotten once the screen showing it has gone (on signing out, and when someone signs in), so nothing of one person's is shown to the next on the same device.
- **Onboarding state** is the session in the store, read through one provider in the `/start` layout (`OnboardingProvider`), which also holds what only onboarding needs (the name as it is typed, the sealing reward, moving between steps). Every step saves through `POST /api/onboarding` and the new state it gets back goes straight into the store; a refresh loads it again from the server, so nothing is lost. The server refuses a step saved out of order, whatever the browser does.
- **Moving between pages** uses the View Transitions API through React's `<ViewTransition>` (CSS in `globals.css`, "View transitions"):
  - landing page → `/start`: the page ground stays linen, the wordmark stays where it is (`view-transition-name: site-wordmark`), and the gift box travels from the landing page into the middle of the first screen (`gift-box`). The landing page draws its box twice (hero and closing scene); only the one on screen offers itself (`sections/hero/traveller.ts`). The app's box (`components/app/GiftBoxArt.tsx`) is the same drawing cut to its own bounds, which is why the two line up.
  - between steps: forward slides in from the right, back from the left (320ms, `ease-gift`). The browser's own back button carries no direction, so it changes without a slide.
  - `/start/everyone` → `/home`: the person's box travels on. Onboarding's last step fetches what `/home` shows into the store (`store/home.ts`), so the box is there on the first frame and `/home` opens without asking again.
  - No view transitions in the browser: pages simply change. Reduced motion: every transition has no length.
- **Theme** (Light · Dark · System, default System): `data-theme` on `<html>`; nothing set means System. The choice is kept on the device (`localStorage`, read before the first paint so it never flashes) and in `preference.theme`, which `/home` applies when it loads, so it follows them to another device. Saving it is sent so that it still arrives if the tab is closed straight after. The toggle is in the `/home` header and the account sheet, never in the middle of onboarding.
- **The recorder** (`components/app/Recorder.tsx`) asks for the microphone only when record is tapped, records with `MediaRecorder` (webm, mp4 or ogg, whichever the browser makes), stops itself at 3 minutes and counts out the last 15 seconds. The recording goes straight from the browser to storage through the signed upload URL.

## Code layout

```
src/proxy.ts                 routing guard
src/instrumentation.ts       validates env at startup
src/app/api/**               route handlers: parse (zod) → session → service → JSON
src/server/env.ts            env validation (zod)
src/server/db/               Drizzle schema, client, PGlite for tests
src/server/auth.ts           Better Auth: anonymous + emailOTP (+ Google when configured)
src/server/services/**       the rules: people, gifts, practical items, onboarding, preferences, plan, guest linking, throttle
src/server/storage.ts        recordings (Supabase Storage, server only)
src/server/email.ts          the sign-in code email (Resend)
src/lib/schemas.ts           zod schemas and types shared by server and browser
src/lib/api-client.ts        the typed browser client for /api/* (used by the store)
src/store/                   TanStack Query: client.ts (how it behaves), StoreProvider.tsx, keys.ts, and one file per thing:
                             session.ts, people.ts, gifts.ts, shelf.ts, home.ts; pending.ts for what is shown before the server answers
src/app/(app)/               /start, /signin and /home, under the layout that gives them the store
src/lib/onboarding.ts        the steps, in order, and the guard's rules
src/lib/hints.ts             the before-paint script: theme, and the "Go to your gifts" hint
src/components/app/          shared by onboarding and /home: the box, rings, tag and envelope (placeholder art),
                             buttons, fields, sheets, the recorder, the message composer, code sign-in, the offer, the theme toggle
src/components/onboarding/   the provider, the shell (wordmark, dots, box) and one file per step
src/components/home/         /home: people as boxes, a person's gifts, the shelf, add someone, the account sheet
drizzle/                     SQL migrations (committed)
tests/                       Vitest (unit + integration, on PGlite)
e2e/                         Playwright
scripts/screenshots.mjs      every onboarding step and /home, at three sizes, light and dark
scripts/migrate.mjs          `npm run db:migrate`
```

## Data model

Postgres (Supabase), through Drizzle. Migrations are generated with `npm run db:generate` and applied with `npm run db:migrate` (`scripts/migrate.mjs`: Drizzle's own migrator, which says why when it can't connect, where `drizzle-kit migrate` exits without a word). `DATABASE_URL` must be Supabase's **Session pooler** string: the direct connection only works over IPv6. The app talks to it through **node-postgres** (`pg`), which sends a query and its values in one round trip (postgres.js, without prepared statements, takes two). In development idle connections are kept open, and one is opened when the server starts (`src/instrumentation.ts`), because opening one is the slowest part from far away.

- **Better Auth tables:** `user` (with `is_anonymous`), `session`, `account`, `verification`, `rate_limit`.
- **`person`** — `id, owner_id, name, relationship, email?, phone?, birthday?, created_at, updated_at`.
- **`gift`** — `id, owner_id, person_id, kind ('voice' | 'letter'), envelope_title, storage_path?, content_type?, letter_text?, duration_seconds?, sealed_at, created_at`. Voice and letters only.
- **`practical_item`** — `id, owner_id, category ('bank' | 'insurance' | 'pension' | 'property' | 'crypto' | 'wish' | 'other'), provider_name, note?, created_at`. Never account numbers, sort codes, card numbers, PINs or passwords: validation refuses anything that looks like one, kindly.
- **`onboarding_progress`** — `user_id, current_step, data (jsonb), completed_at, updated_at`.
- **`preference`** — `user_id, theme, reminder_emails, updated_at`.
- **`plan_interest`** — `id, user_id, choice ('free' | 'paid_interest'), created_at`.
- **`throttle`** — counters for the sign-in code limits.

Every row has an owner, and **every query filters by the signed-in user's id** (services take the user id as their first argument; nothing reads by id alone).

**Row Level Security is on for every table, with no policies** (deny all). Supabase exposes `public` tables through its Data API; with RLS on and no policy, the public keys can read nothing. The app connects as the database owner over `DATABASE_URL`, which RLS does not restrict. A test fails if any table is ever added without RLS.

**The free plan** is one named person. A second answers `upgrade_required`, which the UI turns into the offer. Nothing is ever deleted because of the plan, and a message already sealed is always kept.

## Auth flow

Better Auth with the Drizzle adapter, sessions in secure httpOnly cookies (30 days, refreshed daily), with a 2-minute signed copy of the session in a cookie (`cookieCache`). **Reads** (`GET`) may trust that copy and skip the database; **anything that changes something** checks the session against the database (`src/server/session.ts`), so a session that has ended can't change anything. Our route handlers pass the renewed copy back to the browser.

1. **Guest first.** Answering the first question ("This is for Mary") starts a guest (anonymous) account, so a person, a message and progress can be saved before we ask who they are. Opening `/start` alone starts nothing.
2. **Sign-up is step 3.** Email → a 6-digit code (5 minutes, 3 tries, stored hashed). Verifying it creates or finds the real account.
3. **Linking.** Better Auth's `onLinkAccount` then moves the guest's people, gifts, practical items, plan choices, progress and preferences to the real account **in one transaction**, and the guest account is removed. If the email already had an account, the guest's work joins it.
4. **Google** switches on by itself when `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set; the button only shows then.
5. **Sign out** ends this session; **sign out everywhere** revokes all of them. Another device can't change anything from that moment, and its reads end within 2 minutes, when its copy of the session runs out.

**Limits:** code requests and code checks are limited per email address (in the `throttle` table) and per IP address (Better Auth's limiter, in `rate_limit`).

**Email:** Resend. In development it sends from `onboarding@resend.dev` and also prints the code to the server console. In production the code is never logged.

## Storage

Supabase Storage, private bucket `recordings`, reached only from the server with `SUPABASE_SECRET_KEY`. The browser never sees a key.

- **Upload:** the server checks the type (webm, ogg, mp4/m4a), size (≤ 10 MB) and length (≤ 3 minutes), then issues a signed upload URL for a path inside the person's own folder (`<user id>/<random>.<ext>`). The bucket itself also enforces type and size. When the gift is created the server confirms the file is there and within limits.
- **Playback:** a signed URL that lasts 60 seconds, issued only after checking the gift belongs to the person asking.
- A recording's path is an opaque key. Ownership lives on the `gift` row, so linking a guest account moves no files.

## Security

- Input is validated with zod on every endpoint; errors are plain sentences in the brand voice.
- Ownership on every query; RLS deny-all underneath; secrets only on the server (`server-only` imports).
- **Never print or log secrets**, env values, sign-in codes (outside development) or session tokens.
- We never ask for, or store, passwords, PINs, account numbers or card numbers.

### Encryption — TODO before any real data

- [ ] **Split-key encryption.** Encrypt recordings, letters and practical items on the device before upload, with a key split between the person, their executor and afterbox, so that no single party (including us) can open them. Opening needs a verified death plus the executor's credential. Until this exists, afterbox staff with database access could read stored content: **test data only**.
- [ ] Key recovery, executor verification and the release flow.
- [ ] Remove the dev console code log path from production builds entirely (it is already off there).

## Testing

- **Vitest** (`npm test`): unit and integration tests against **PGlite** (Postgres in-process) using the same Drizzle migrations, so tests never touch Supabase. Storage and Resend are faked. Covers guest sessions, progress save and resume, guest → account linking, the free-plan limit, ownership, upload validation, the no-numbers rule, code rate limits, theme, plan choice, and RLS on every table.
- **Playwright** (`npm run test:e2e`; first `npx playwright install chromium`): starts the app itself on port 3100 with `E2E_TEST_MODE=1`: PGlite instead of Supabase, a stand-in for storage, and sign-in codes read from a test-only hook (`/api/test/otp`), never from logs. Every secret it is given is a made-up value, so it cannot reach the real database, bucket or inbox, and the app refuses to start in test mode in production. Test mode builds into `.e2e/` rather than `.next/`, so it can run beside the everyday dev server. Runs at phone and desktop size. Covers the whole onboarding (with a voice note from a pretend microphone), resume on refresh, a returning sign-in that skips onboarding, the second-person offer, the no-numbers rule on the shelf, the landing page → `/start` transition (and its reduced-motion version), "Go to your gifts", sign-out, the theme toggle, and the store: `/home` opening without asking again, the shelf and a new gift shown before the server answers, both put back (with what was made kept) when it refuses, only the changed list being refreshed, and nothing of one person's shown to the next.
- **Screenshots** (`node scripts/screenshots.mjs`, with the app running in test mode as above): every onboarding step and `/home` at 320×568, 390×844 and 1440×900, light and dark, into `test-results/screenshots/`.
- `npm run lint` and `npm run build` must be clean.
