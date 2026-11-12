@AGENTS.md

# afterbox

afterbox is a personal life vault people build over a lifetime **for the people they love most**: accounts, policies, pensions, crypto wallet locations, final wishes, and personal video/voice/written messages assigned to named people. It stays sealed while they're alive, grows with them, and opens for those people when the time comes, with a calm step-by-step dashboard for the executor.

It also offers **family support**: paid, guided help for any family that has just lost someone, whether or not that person used afterbox. It reaches people through **employers, insurers and banks** who offer it to their staff and customers ("powered by afterbox").

- Stack: Next.js 16 (App Router, `src/`), TypeScript, Tailwind CSS v4. Planned for animation: the Motion library (`motion`) for scroll scenes; SVG or Rive/Lottie for illustrations.
- Status: the product isn't built yet. **The landing page is the current build.** Its primary call to action is **Build their gift** (the closing one is **Begin with someone you love**); both lead to onboarding, sign-up and then the dashboard (`/start` is a placeholder until those exist). **Never lead with "vault" in marketing copy**: lead with the people and the gift, and make every line carry both love and necessity (design system: "Lead with the gift, not the vault").
- Launch market: UK first (domain: afterbox.co.uk), US later.

## Read before building

- `docs/landing-page-story.md` — **the landing page story, section by section**: what each section says, the feeling, desktop and mobile behaviour, motion signature and hand-off. Build the landing page from this.
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
- Dark mode (Candlelight) switches automatically through the tokens, following the device setting. Don't add `dark:` colour overrides; in dark, cards must keep their `border-line` border.
- Mobile first: 20px side margins (`px-5`), primary button full width at the bottom, min 44px touch targets, body text never under 16px. Draw key illustrations twice (landscape and portrait) rather than shrinking.

## Motion and performance

- Animate only `transform` and `opacity`. Pinned scenes: ~250vh desktop, ~180vh mobile; never trap the scroll.
- Every animated scene needs a `prefers-reduced-motion` fallback: its final frame, shown still (global CSS already shortens animations).
- Lazy-load later scenes; the hero must be interactive within 2.5s on a mid-range phone.
