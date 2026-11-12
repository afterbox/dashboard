# Reference breakdowns

What we're borrowing from each site, written as a **spec for afterbox**: concrete enough to build from.

- "What Justice loved" is his own reaction to the site.
- "Our spec" is what *we* build. The numbers are our targets, not measurements of the original site.
- Visual frames for each reference live in `docs/references/` (see `docs/references/README.md`). Look at them alongside this file.
- To study a live page, use Claude in Chrome from Claude Code (`/chrome`): open the page, scroll slowly and screenshot at each step.

**Rule:** borrow the *idea and the feel*, never the artwork, copy, layout grid or brand assets. afterbox must not look like any of these sites.

---

## Mercury → the hero zoom and the closing zoom-out
- **Link:** https://mercury.com
- **What Justice loved:** as you scroll, it zooms in and in until it reaches the content. "Made me think of my life in the years that follow."
- **Our spec:**
  - A pinned scene: about 250vh of scroll on desktop and about 180vh on mobile. Scroll progress drives the camera; nothing autoplays.
  - Built from 4–6 layered illustration planes (street → house → window → table → rings → box). The camera scales through them from 1× to roughly 8–10×. Nearer layers scale faster than far ones (parallax depth), and each layer fades out as the camera passes through it.
  - The rings: each ring draws in (`stroke-dashoffset`) as the camera passes it, and a faint life-moment label fades in beside it ("bought a home", "Mary is born").
  - Arrival: the box settles with a tiny `ease-gift` overshoot; the handwritten note fades in; *then* the headline rises 16px and fades in, then the CTA.
  - The closing section plays the same scene in reverse (box → house at night, all lights on) over about 150vh.
  - Implementation: Motion's `useScroll` + `useTransform` on `transform: scale()` and `opacity` only. Each layer is an SVG; no canvas needed.
  - Reduced motion: show the final frame (box, note, rings) with the headline.

## Framer → the flow: every section sets up the next
- **Link:** https://framer.com
- **What Justice loved:** "It almost felt like a demo and I was eager for the next section." Each section presents what follows the last one.
- **Our spec:**
  - Every section ends with a **hand-off**: an object or line that carries into the next section. The hand-offs are listed in `docs/landing-page-story.md`, e.g. the papers gather into the box, and the envelopes slide in and the lid closes.
  - The hand-off begins in the last ~20% of a section's scroll, so the next section is already arriving as you finish reading.
  - Product moments look like the real product (cards, a dashboard on a phone), shown working, not described.
  - Never a hard cut between sections: a shared object (the box, the rings, Biscuit) or a colour transition joins them.

## Duolingo → playfulness and the pull to come back
- **Link:** https://www.duolingo.com
- **What Justice loved:** the playfulness, moving to the next section with a cartoonish feeling, how it makes you subscribe and want to come back. It's what inspired afterbox.
- **Our spec:**
  - The illustrated cast (Gift mode only), with **Biscuit** reacting to what you do: he sits up when a card appears and wags when it drops into the box.
  - Small rewards: each item added makes the box squash slightly (scale 1 → 0.96 → 1 over 300ms, `ease-play`), grows a new ring and shows a short success line (*"One less thing for them to search for."*).
  - The come-back loop in section 6: a ring for each year, nudge cards that pop in (`ease-play`, scale 0.9 → 1), Biscuit greying over the years.
  - The joy is in the *reactions*, not in clutter: one reaction at a time, never confetti.
  - The product itself (later) uses event-driven nudges, not streaks: "You bought a home. Add it?"

## Lemonade → everyday illustrated objects
- **Link:** https://www.lemonade.com
- **What Justice loved:** the hero animation of everyday, cartoonish objects and living things: a person, a bird, a house, a cloud.
- **Our spec:**
  - The world of the story is built from simple everyday things: the house, a bird on the roof, clouds drifting slowly (10–20s loops), a lamp in the window, the kitchen table.
  - Ambient motion is very slow and very small (a cloud drifting, a bird hopping once), so the scene feels alive but never busy.
  - Style follows the design system ("Illustration and the cast"), not Lemonade's style.

## Raycast → the quality bar
- **Link:** https://www.raycast.com
- **What Justice loved:** the design and the flow were superb.
- **Our spec:** this is the polish standard, not a concept to copy.
  - Pixel-tight alignment and spacing from the tokens only.
  - Product UI shown crisp and real, with shadows from `shadow-rest` and `shadow-lift`.
  - A steady rhythm: generous section padding (`space-24` desktop, `space-16` mobile), with one idea per screen-height.
  - No janky motion: 60fps on a mid-range phone, or cut the effect.

## Empathy → every section moves differently
- **Link:** https://www.empathy.com
- **What Justice loved:** each section animates differently on scroll and genuinely feels different. Also the hero's typed AI-chat questions that clear and retype, over a dimmed video.
- **Our spec:**
  - Each section has its own **motion signature** (listed in the story doc): zoom · typing · drop-and-bounce · slow paper · mechanical clasp · timeline rhythm · slow lift · stagger.
  - We do **not** copy their chat-typing hero; it's their signature, and they're a near competitor. A small version of typing appears only in section 2 (search questions at the kitchen table) and section 8 (family-support questions).
  - Typing: about 35ms per character, a 1.2s pause on the finished line, then clear at 15ms per character.

## Headspace → warmth
- **Link:** https://www.headspace.com
- **What Justice loved:** the overall warmth.
- **Our spec:** already captured in the design system's palette, soft shapes and voice. Use it as the tone check: if a section feels cold or corporate, it's wrong.
