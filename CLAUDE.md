@AGENTS.md

# afterbox

afterbox is a personal life vault people build over a lifetime **for the people they love most**: accounts, policies, pensions, crypto wallet locations, final wishes, and personal video/voice/written messages assigned to named people. It stays sealed while they're alive, grows with them, and opens for those people when the time comes, with a calm step-by-step dashboard for the executor.

It also offers **family support**: paid, guided help for any family that has just lost someone, whether or not that person used afterbox. It reaches people through **employers, insurers and banks** who offer it to their staff and customers ("powered by afterbox").

- Stack: Next.js 16 (App Router, `src/`), TypeScript, Tailwind CSS v4. Planned for animation: the Motion library (`motion`) for scroll scenes; SVG or Rive/Lottie for illustrations.
- Status: the landing page, onboarding (`/start`) and a first version of the app (`/home`) are built, as a **prototype for test data only** (the real split-key encryption comes later; see `docs/architecture.md`). The landing page's primary call to action is **Build their gift** (the closing one is **Begin with someone you love**); both lead straight to onboarding's first question at `/start` ("Think of someone you love. Who came to mind first?"; there is no welcome screen, because the landing page has already said what this is), where sign-up is step 3, and then `/home`. For someone signed in they read **Go to your gifts**. **Never lead with "vault" in marketing copy**: lead with the people and the gift, and make every line carry both love and necessity (design system: "Lead with the gift, not the vault").
- Launch market: UK first (domain: afterbox.co.uk), US later.

## The app

**Routes**

- `/` — the landing page.
- `/start` → `/start/<step>` — onboarding, one URL per step: `someone`, `message`, `keep-safe` (sign-up), `reach`, `find`, `nudges`, `everyone`. Build it from `docs/onboarding-story.md`. The pages are static; who is here is loaded in the browser from `/api/session` (`src/components/onboarding/`).
- `/home` — their people as gift boxes, each person's gifts, the practical shelf.
- `/signin` — returning people (email code; Google only once configured).
- `/api/*` — route handlers: `auth/*` (Better Auth), `session`, `visitor`, `onboarding`, `people`, `gifts`, `practical-items`, `preferences`, `plan`. `api/test/*` exists only in end-to-end test mode.
- `src/proxy.ts` — the routing guard (Next.js 16's Proxy, formerly Middleware): no session or unfinished onboarding → `/start/<saved step>`; finished → `/home`.

**Backend stack** (all inside this Next.js app; `docs/architecture.md` has the detail)

- Database: Supabase Postgres through **Drizzle** (`src/server/db/schema.ts`), migrations in `drizzle/` (`npm run db:generate`, `npm run db:migrate`). **Row Level Security is on for every table with no policies**; every new table needs `.enableRLS()`.
- Auth: **Better Auth** with the Drizzle adapter; plugins `anonymous` (guest accounts, linked on sign-up) and `emailOTP` (6-digit codes). Google switches on when its two env vars exist.
- Email: **Resend**. Storage: **Supabase Storage**, private bucket `recordings`, server only.
- Validation: **zod** on every endpoint (`src/lib/schemas.ts`). Rules live in `src/server/services/`; every query filters by the owner.
- Tests: **Vitest** on PGlite (`npm test`), **Playwright** (`npm run test:e2e`; it starts the app in test mode on port 3100, with made-up secrets). Screenshots of every step: `node scripts/screenshots.mjs`.
- Client data: **TanStack Query**, all of it in `src/store/` (`client.ts` for retries, refresh and the signed-out redirect; one file per thing: `session`, `people`, `gifts`, `shelf`). It is the only global store. Components read and change server data through its hooks, never with `fetch` or a second copy in state; a change refreshes its own list only. `/start`, `/signin` and `/home` live in `src/app/(app)/`, whose layout provides it.
- Shared app UI is in `src/components/app/` (the gift box, buttons, fields, sheets, recorder, code sign-in, offer, theme toggle). Reuse it; don't make a second button or sheet.

**Env vars** (in `.env.local`, never committed; names listed in `.env.example`)

`DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `RESEND_API_KEY`. Optional: `EMAIL_FROM`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `TRUELAYER_CLIENT_ID`, `TRUELAYER_CLIENT_SECRET`, `TRUELAYER_ENV`. Test only: `E2E_TEST_MODE`.

**Rules for the app**

- **Never print or log secrets**: no env values, keys, session tokens or sign-in codes in the terminal, in logs, in errors, in tests or in chat. (The one exception is the sign-in code in the server console in development.) Read env only through `src/server/env.ts`.
- **Secrets stay on the server.** Anything under `src/server/` imports `server-only`. The browser never sees `SUPABASE_SECRET_KEY` or any other key.
- **Names, never numbers.** We never store account numbers, sort codes, card numbers, PINs or passwords; validation must refuse them kindly.
- **The free plan is one person.** A second gets the warm offer, not an error. Never delete anything because of the plan.
- **Theme:** the app has a **Light · Dark · System** toggle (default **System**), in the `/home` header and the settings sheet, never in the middle of onboarding. The choice is saved in the person's preferences and on the device. It works by setting `data-theme` on `<html>` (nothing set means System).

## Read before building

- `docs/landing-page-story.md` — **the landing page story, section by section**: what each section says, the feeling, desktop and mobile behaviour, motion signature and hand-off. Build the landing page from this.
- `docs/onboarding-story.md` — **the onboarding story, step by step**: the words, the order and the rewards. Build `/start` from this.
- `docs/architecture.md` — routes, data model, auth flow, storage, security and testing.
- `docs/design-system.md` — the brand book: voice, colour, type, layout, mobile, dark mode, motion, the three modes, the illustrated cast, scroll storytelling.
- `docs/tokens.json` — the design tokens (source of truth).
- `docs/references.md` — what we borrow from each reference site (Mercury, Framer, Duolingo, Lemonade, Raycast, Empathy, Headspace), written as a spec with concrete numbers. Look at the matching frames in `docs/references/`.
- `docs/illustrator-brief.md` — the illustrated cast and scenes being commissioned.
- `docs/strategy.md` — product and business context.
- `src/app/globals.css` — tokens wired into Tailwind. **Use these utilities; never hard-code hex values or font sizes.**

## The landing page in one paragraph

A story you scroll, combining **Mercury** (the hero zooms in through the years, the growth rings, to a small box with a note _Isla, everything you'll need is in here. You won't have to guess. Love, Dad x_; the final scene zooms back out to the house at night), **Framer** (every section sets up the next, like a demo) and **Duolingo** (playfulness, an illustrated cast with **Biscuit the family dog** as the recurring character, small rewards, and the pull to come back). Sections: hero zoom → the kitchen table (the problem, gently) → fill it, a little at a time (playful demo) → say it, for later (messages) → sealed, even from us (trust) → it grows with you → when the time comes (Still mode) → family support (Still mode) → for organisations → zoom back out + waitlist → footer. **The same story, in the same order, on mobile and desktop.**

## Non-negotiables

- **Name:** always `afterbox`, all lowercase, even at the start of a sentence.
- **Love first.** Lead with the people, never with death, money or features. Calm, never fear-selling.
- **Copy:** sentence case everywhere, plain words, short sentences. Say "the people you love most", never "beneficiaries". Use the person's name, never "the deceased".
- **Three modes** (see design system): _Gift_ (vault-builders, landing page: full palette, rings, illustrated cast, `ease-play`), _Still_ (bereaved families: no gold, no glow, no cast, no bounce, fades only, one task at a time), _Partner_ (co-branded: partner logo in header lockup only, `partner-accent` for buttons).
- **The cast** (Gift mode only): original flat, rounded illustrations in the brand palette. Biscuit is part of the family, not a mascot: he never talks or sells, and never appears in the logo. No characters in Still mode.
- **Trust lines, exact wording:** "Not even afterbox can open your vault." · "We never sell your data." · "We never ask for passwords, PINs or card numbers." · "We guide you. We don't give legal or financial advice."
- **Referral fees** are always disclosed in plain words next to the button.
- **Avoid the AI look:** follow the "Avoid the AI look" section below strictly.

## How we build (follow this every time)

1. **One section at a time.** Never build the whole landing page in one pass. Plan first (plan mode), then build one section from `docs/landing-page-story.md`, then stop for review.
2. **Read the spec, then look.** Before building a section, read its entry in the story doc and in `docs/references.md`, and look at its frames in `docs/references/`. If Claude in Chrome is connected (`/chrome`), open the reference site, scroll to the effect and screenshot it.
3. **Check your own work in the browser.** Run the dev server, open the page at desktop width (1440px) and phone width (390px), in light and dark mode, and screenshot it. Compare against the spec before saying it's done.
4. **Illustrations:** the real cast is being commissioned (`docs/illustrator-brief.md`). Until it arrives, use **simple placeholder shapes** (rounded blocks in palette colours, with no visible text labels; name layers in code only) on the same layers and positions. **Never** generate detailed characters in SVG yourself; it's what makes sites look AI-made.

## Avoid the "AI look" (hard rules)

If any of these appear, the work is wrong:
- Purple, blue or rainbow gradients; glowing blurred blobs; mesh gradients.
- A grid of three (or six) identical feature cards with an icon, a bold title and two lines of text.
- Emoji used as icons; stock icon sets dropped in without purpose.
- Glassmorphism (frosted see-through cards), neon, heavy drop shadows.
- Inter, Poppins or any font other than Fraunces, Figtree and Caveat.
- Fake logo strips ("Trusted by…"), fake testimonials, fake stats, fake star ratings.
- Every section entering the same way (all fade-up). Each section has its own motion signature from the story doc.
- Everything centred; uniform section heights; a wall of equal-width columns.
- Generic copy: "Revolutionize", "Seamless", "Unlock", "Empower", "All-in-one", "Next-gen". Use the voice in the design system.
- Stock photos of people smiling at laptops.

What good looks like instead: one strong idea per screen, generous space, real product moments shown working, specific human copy with names ("Mary, everything you'll need is in here. You won't have to guess."), hand-offs between sections, and motion that means something.

## Tailwind usage

- Colours: `bg-linen` (page), `bg-paper` (cards), `bg-blush`, `text-ink`, `text-ink-muted`, `bg-heartwood` + `text-on-heartwood` (primary action, one per screen), `hover:bg-heartwood-deep`, `bg-keepsake`, `bg-lantern` + `text-on-lantern` (decorative only), `text-sage`, `text-alert`, `border-line`.
- Type: `font-display` + `text-display-xl` / `-l` / `-m` / `-s` for headlines; on mobile use `text-display-xl-mobile md:text-display-xl`. Body: `text-body-l-mobile md:text-body-l`, `text-body`, `text-small`, `text-label`, `eyebrow`. `font-note text-note` only for the user's own words.
- Radius: `rounded-sm` 8, `rounded-md` 14, `rounded-lg` 24 (cards), `rounded-xl` 40 (panels), `rounded-pill` (buttons).
- Shadow: `shadow-rest`, `shadow-lift`, `shadow-glow` (once, briefly, Gift mode only).
- Easing: `ease-gift` for entrances, `ease-state` for state changes, `ease-play` (small overshoot) for playful Gift-mode moments only.
- Dark mode (Candlelight) switches automatically through the tokens, following the device setting, or the person's own choice from the Light · Dark · System toggle. Don't add `dark:` colour overrides; in dark, cards must keep their `border-line` border.
- Mobile first: 20px side margins (`px-5`), primary button full width at the bottom, min 44px touch targets, body text never under 16px. Draw key illustrations twice (landscape and portrait) rather than shrinking.

## Motion and performance

- Animate only `transform` and `opacity`. Pinned scenes: ~250vh desktop, ~180vh mobile; never trap the scroll.
- Every animated scene needs a `prefers-reduced-motion` fallback: its final frame, shown still (global CSS already shortens animations).
- Lazy-load later scenes; the hero must be interactive within 2.5s on a mid-range phone.
