# afterbox landing page — the story

> One page, one story: **a life, the people in it, and the love that still reaches them after.**
> It should feel like watching a short film you can scroll: playful where life is playful, tender where it's tender. You finish it wanting to start, not afraid.

## References and what we take from each

| Reference          | What we take                                                                            | Where it shows up                                                  |
| ------------------ | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| **Mercury**        | The zoom: scrolling carries you deeper and deeper into one scene                        | Hero (zoom in through the years) and final section (zoom back out) |
| **Framer**         | The page as a demo: every section sets up the next, so you're eager to see what follows | A visible hand-off at the end of every section                     |
| **Duolingo**       | Playfulness, an illustrated cast, small rewards, and the pull to come back              | The "fill it" demo, Biscuit the dog, the "it grows with you" loop  |
| Empathy (one idea) | Every section animates differently and feels distinct                                   | Each section has its own motion signature (listed below)           |
| Raycast            | The quality bar: polish, rhythm, detail                                                 | Everywhere                                                         |

## The general feeling

- **Overall:** wonder → a gentle pang → delight → tenderness → safety → companionship → being held → resolve.
- **Tone:** warm, honest, never morbid, never fearful. Death is named honestly once and gently; love is the subject.
- **Mode:** Gift mode throughout, except sections 7 and 8, which shift to Still mode (no gold, no bouncing, no cartoon antics).
- **Primary action:** **Build their gift**. It leads into onboarding (which starts by asking who you love), sign-up and then the dashboard. Until those exist, it goes to a simple `/start` placeholder page.
- **Language:** never lead with "vault" in this page's copy (see the design system, "Lead with the gift, not the vault"). Every section should carry love _and_ necessity.

## The cast (Gift mode only)

An original illustrated cast, flat and rounded, built from the brand palette (see the design system, "Illustration and the cast"):

- **The family:** you (Dad), your partner Jo (Mary's mum), Mary (your daughter, who grows up through the page), and your own mum.
- **Biscuit, the family dog.** The recurring character who carries the eye from section to section: he trots in, nudges the box, wags when something is added, and quietly ages through the page (puppy → grey muzzle). He's part of the family, not a brand mascot. He's also a nod to "what happens to the dog?", one of the wishes people record.
- **Everyday things:** the house, a bird on the roof, clouds, a kitchen table, letters, the box.

---

## Section by section

Each section lists: **what it says**, **what you should feel**, **what happens** (desktop), **mobile**, **motion signature** and **hand-off** to the next section.

### 0. Navigation

- **Says:** who we are, quietly. `afterbox` wordmark · How it works · For families · For organisations · **Build their gift**.
- **Feel:** calm, uncluttered.
- **Desktop:** transparent over the street while the page is at rest. Once the zoom starts and the art passes underneath, and for the rest of the page, a solid `linen` bar with a `line` hairline fades in over 200ms. Solid, never blurred or frosted.
- **Mobile:** wordmark + a compact **Build their gift** pill (small, 40px tall, `text-small` weight 600); links live in a bottom sheet.

### 1. Hero: "Your life, in the years that follow" (Mercury zoom)

- **Says:** _Build it for them. Before they need it._ Sub: _Everything they'll need to find, and everything you want them to hear. Gathered as your life grows, and given to them when the time comes._
- **Feel:** wonder and tenderness, then the point lands: "This is about my life, and about them never having to guess."
- **Why this note:** it carries both halves of afterbox in one line: the practical relief (everything they'll need, no guessing) and the love (from Dad). A birthday message alone would feel sweet but trivial; this is the real pain afterbox solves.
- **What happens:** a pinned scroll scene (~250vh). We open on a wide illustrated street at dusk. Scrolling zooms into one house → through the lit window → the family at the kitchen table, Biscuit asleep underneath → the camera keeps going _into_ the tree-ring motif, each ring faintly marked with a life moment ("bought a home", "Mary is born", "a new job", "Mary turns 10") → we arrive at a small linen box tied with a `lantern` ribbon and a handwritten note (`font-note`): _Mary, everything you'll need is in here. You won't have to guess. Love, Dad x_ The headline and CTA rise in.
- **Mobile:** the same sequence, composed portrait (street → window → table → rings → box), pinned for ~180vh. The headline sits in the lower third, the CTA full-width at the bottom.
- **Ambient life:** while the page sits still, the scene is alive: clouds drift (a crossing takes one to two minutes), the tree sways, the bird hops between perches, the family breathes and blinks, Biscuit's ear twitches. **The ball:** a small `heartwood` ball rests on the edge of the kitchen table. As the room comes into view it rolls off, drops, bounces twice and settles on the floor. It happens once: after that it stays on the floor however the page is scrolled, until the page is reloaded.
- **Small screens:** the final frame (rings, box, note) always fits between the nav and the words, shrinking as far as it must. Where the rings are too small to carry their labels the labels are left out, and where the note would be too small to read the note is left out (only on the very smallest screens).
- **Motion signature:** continuous zoom (scale + depth layers), rings drawing outward.
- **Reduced motion:** the final frame (box, note, rings) with the headline; no zoom, no ambient motion, and the ball already on the floor.
- **Hand-off:** Biscuit wakes, nudges the box, and the camera pulls slightly back to the table.

### 2. "The kitchen table" (the problem, told gently)

- **Says:** picture the person you love most, three days after losing you, at the kitchen table with a laptop and a notepad, not knowing where to begin. They search, guess and miss things. Plain facts: _about 400 hours of admin work_ · _£15B in unclaimed assets in the UK_. Then the turn: **It doesn't have to be this way.**
- **Feel:** a quiet pang. "I don't want that for them." Not fear.
- **What happens:** the same kitchen, now at night: one empty chair, scattered papers. Questions type and clear in a search bar, one after another: _Did Mum have life insurance?_ · _Which pension was from her first job?_ · _Where are the keys to her wallet?_ Two stats fade in, set large in `font-display`.
- **Colour:** quieter for a moment: `keepsake` and `linen`, no `lantern`, Biscuit lying still.
- **Mobile:** the questions stack one at a time in the centre; the stats follow as two full-width lines.
- **Motion signature:** typing and clearing; slow fades.
- **Hand-off:** on _It doesn't have to be this way_, the scattered papers lift and gather into the box.

### 3. "Fill it, a little at a time" (the playful demo, Duolingo + Framer)

- **Says:** you add what they'd need to find, in minutes, and afterbox finds what you'd forget.
- **Feel:** delight and ease. "This is easy, even fun."
- **What happens:** four short beats. Each drops an item into the box with a soft bounce (`ease-play`), grows a new ring, flashes a brief `glow`, and shows a success line in the brand voice.
  1. **Accounts:** you connect your bank; a card flips: _We noticed a monthly payment to an insurer. Is that a life policy?_ → **Add it** → drops in. _One less thing for them to search for._
  2. **Pensions and policies:** two cards slide in and drop.
  3. **Crypto:** _Where the key lives, never the key itself._
  4. **Wishes:** _What happens to Biscuit?_ Biscuit sits up and wags as the card drops in.
- **Mobile:** the box is sticky at the bottom of the screen and the four beats scroll up into it one by one, so the box visibly fills and its rings grow.
- **Motion signature:** cards flip and drop with overshoot; the box squashes slightly on each catch.
- **Hand-off:** a final card that's different from the rest, handwritten: _And the things only you can say…_

### 4. "Say it, for later" (the emotional core)

- **Says:** record a video, a voice note or a letter, and give each one to exactly the right person.
- **Feel:** tenderness; a lump in the throat.
- **What happens:** a `blush` band. Three messages, each addressed in handwriting: a letter, _For Mary, on her 18th birthday_ · a voice note, _For Jo, for when the house feels quiet_ · a video, _For Mum._ Each is a card that makes itself as you scroll to it: the letter writes itself, the voice-note waveform records, the video records. Nothing needs pressing. Mary grows up through the illustrations beside the opening words (child → teenager).
- **Mobile:** the three cards sit one under another, and play the same way.
- **Motion signature:** slow, unhurried (no bounce): paper sliding, ink appearing.
- **Hand-off:** the envelopes slide into the box, and the lid begins to close.

### 5. "Sealed. Even from us." (trust)

- **Says:** **Not even afterbox can open your vault.** The key is split, so it only opens with a verified death plus your executor. _We never sell your data. We never ask for passwords, PINs or card numbers._
- **Feel:** relief and calm confidence. Premium, solid, Mercury-like.
- **What happens:** a `keepsake` band. The lid closes and the ribbon ties itself. A key appears and splits into pieces, which travel to separate holders (your executor, a verification check, afterbox), none able to open it alone. The trust lines settle in.
- **Mobile:** the key splits vertically; the trust lines are three stacked rows.
- **Motion signature:** precise, mechanical, satisfying (the click of a clasp). No bounce.
- **Hand-off:** the sealed box sits still, and the rings around it start to grow again: time passing.

### 6. "It grows with you" (the come-back loop)

- **Says:** your life changes, and your vault changes with it. afterbox nudges you gently when something new happens.
- **Feel:** companionship. "This lives with me." Not a chore.
- **What happens:** a horizontal timeline of years; a ring is added for each. Gentle nudge cards appear on the timeline: _You bought a home. Add it?_ · _Mary turns 10 this year. Record something new?_ · _A new direct debit to a pension provider. Is that yours?_ A small yearly check-in shows the vault growing. Biscuit gets a little greyer along the way.
- **Mobile:** the timeline runs vertically; nudge cards pop in on scroll like notifications.
- **Motion signature:** a steady rhythm of ring after ring; the cards pop in with a light bounce.
- **Hand-off:** the last ring settles, and the copy says simply: _And one day…_

### 7. "When the time comes" (the opening; Still mode begins)

- **Says:** the vault stays sealed until a death is verified. Then everyone you named hears from afterbox, gently, and sees only what you left for them. Your executor gets a calm, step-by-step guide.
- **Feel:** being held. "My love still reaches them."
- **What happens:** Still mode. No gold, no bouncing; Biscuit appears only as an old dog resting by the door, still. Mary, now a young woman, receives a gentle message. **The lid lifts** (the signature moment, slow, 1400ms+), and her letter rises out. Beside it, a phone shows the executor's dashboard: _We're so sorry. We'll take this one step at a time._ · _3 of 12 done. Nothing else is urgent today._ · pre-written letters to each institution.
- **Mobile:** the lid moment fills the screen; the dashboard follows as a full phone mockup.
- **Motion signature:** slow fades and one slow lift. Nothing else moves.
- **Hand-off:** a quiet line: _Already lost someone? We can help now._

### 8. "For families, right now" (family support, Still mode)

- **Says:** even if the person you lost never used afterbox, we'll help you find what they had and settle it, one step at a time.
- **Feel:** compassion and immediate relief.
- **What happens:** no illustrated cast. Typed questions are answered with calm first steps, e.g. _Where do I find Dad's pension?_ → _Start here: we'll help you trace it in three steps._ Secondary CTA: **Get help now**.
- **Mobile:** one question and answer per screen-height, with the CTA at the bottom.
- **Motion signature:** typing, then a soft fade in of the answer.
- **Hand-off:** a gentle return to warmth; the colour comes back for the next section.

### 9. "Give it to your people" (for organisations)

- **Says:** employers, insurers and banks can give afterbox to their people, as a benefit or _powered by afterbox_ in their own app.
- **Feel:** credible, clear, still warm.
- **What happens:** **one panel with three tabs**: Employers · Insurers · Banks. Never three cards side by side (see "Avoid the AI look"). Employers is open first. Choosing a tab changes three things inside the same panel, and nothing else moves: the headline, two lines of copy, and an example lockup, _[Partner logo] · powered by afterbox_, shown where it would really sit for that kind of partner.

  | Tab           | Headline                                                          | Two lines of copy                                                                                                                              | Example lockup                                                                                                                      |
  | ------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
  | **Employers** | _A gift to your team, and the people they love._                  | Give everyone who works for you a place to gather what their family would need to find. · It's theirs to keep building, whatever happens next. | The welcome an employee sees: _[Partner logo] · powered by afterbox_, above _A gift from [Company] to you and the people you love._ |
  | **Insurers**  | _Fewer unclaimed policies, and families who know what they have._ | Your policyholders note where their policy lives, so the people they love can find it. · When the time comes, the family knows to come to you. | The header of a policyholder's page: _[Partner logo] · powered by afterbox_.                                                        |
  | **Banks**     | _A caring feature for your customers and their families._         | Offer it inside your own app, under your own name. · Your customers build it over the years; their families are looked after when it matters.  | The header of a screen in the bank's app: _[Partner logo] · powered by afterbox_.                                                   |

  The lockup follows Partner mode in the design system: the partner's logo appears in the header lockup only, and `partner-accent` may colour the example's button. **No real or invented company logos:** the logo is a plain rounded placeholder block. CTA under the panel: **Talk to us**.

- **Desktop:** the panel is wide and split in two. The tabs run across the top; the words sit on the left and the example lockup, on a small app or page frame, sits on the right. One panel, one height: it doesn't jump when the tab changes.
- **Mobile:** the tabs become a **segmented control** at the top of the panel: three equal segments across the full width, at least 44px tall. Below it, the headline, the two lines, then the lockup. The CTA is full width at the bottom.
- **Behaviour:** real tabs. They change only when chosen (tap, click, or the arrow keys); they never rotate on their own. All three sets of words are in the page for screen readers and search.
- **Motion signature:** the marker under the tabs **slides** to the chosen one (`ease-state`, 240ms) while the words and the lockup **cross-fade in place** (out 120ms, in 200ms). The panel itself arrives with a single fade; no staggered fade-up. Reduced motion: the marker and the words swap at once.
- **Hand-off:** back to the box for the final scene.

### 10. Final scene: zoom back out (Mercury bookend)

- **Says:** _Start building it for them._ One button: **Begin with someone you love**.
- **Feel:** resolve and warmth: the story closes the loop.
- **What happens:** the reverse of the hero: from the box out through the rings, through the window, to the house at night with every light on, and Biscuit on the doorstep.
- **Mobile:** a shorter reverse zoom; the button is pinned at the bottom.
- **Reduced motion:** the house-at-night frame only.

### 11. Footer

- `keepsake` band with the `afterbox` wordmark in `linen`. The trust lines. Links: How it works · For families · For organisations · Privacy · Terms. The small print: _We guide you. We don't give legal or financial advice._

---

## Responsive rules (same story on every screen)

- **Same sections, same order, same words** on mobile and desktop. Only the composition changes.
- Desktop compositions are wide and side-by-side; mobile compositions are portrait, with a sticky object (the box) where useful.
- Pinned scroll scenes are shorter on mobile (hero ~180vh instead of ~250vh) and never block scrolling.
- Illustrations are drawn twice where needed (landscape and portrait framing), not just scaled down.
- The primary action is always reachable: in the nav on desktop, pinned at the bottom on mobile.
- Every animated scene has a `prefers-reduced-motion` fallback: its final frame, shown still.

## Build notes

- Illustrations: SVG (layered for the zoom) or Rive/Lottie for character motion (Biscuit). Keep them inline and lightweight.
- Scroll motion: the Motion library (`motion`, formerly Framer Motion) with `useScroll` / `useTransform`, using transforms and opacity only, for smooth 60fps on phones.
- **Build their gift** and **Begin with someone you love** link to `/start`: sign-up, then the vault dashboard. Until those exist, `/start` is a simple placeholder page in the brand style.
- Performance budget: the hero must be interactive within 2.5s on a mid-range phone; lazy-load later scenes.
