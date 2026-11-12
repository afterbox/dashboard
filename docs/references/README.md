# Reference frames

Still frames cut from short screen recordings of the reference sites, so an AI (or a person) can see the motion we mean.

## How to add a reference

1. Record 5–10 seconds of the effect on your Mac: **Cmd+Shift+5** → "Record Selected Portion". Scroll slowly and steadily through just the effect.
2. Cut it into frames (needs ffmpeg once: `brew install ffmpeg`):

   ```
   ./scripts/frames.sh ~/Desktop/mercury-zoom.mov hero-zoom 6
   ```

   This saves `docs/references/hero-zoom-01.png` … `hero-zoom-06.png`, evenly spaced through the clip.
3. Add a line to the table below.

## Naming

`<our-section>-<what>-NN.png`, named after **our** section in `docs/landing-page-story.md`, not the source site, e.g. `hero-zoom`, `fill-it-drop`, `grows-timeline`, `sections-motion-variety`.

## Index

| Frames | Source | What to look at |
|---|---|---|
| _(add rows as you record)_ | | |

Suggested first set (about 6–8 clips):
- `hero-zoom`: Mercury, the scroll zoom.
- `flow-handoff`: Framer, one section handing off to the next.
- `fill-it-reaction`: Duolingo, a character reacting to an action.
- `world-objects`: Lemonade, the everyday-objects hero.
- `sections-motion-variety`: Empathy, two consecutive sections with different scroll animations.
- `polish`: Raycast, a product section, for the quality bar.
