# Illustration brief: afterbox

## About afterbox

afterbox is a personal life vault people build over a lifetime for the people they love most: the accounts, policies and wishes their family would need to find, and personal messages for each person they name. It stays sealed while they're alive, grows with them, and opens for their family when the time comes.

The subject touches on death, but the brand is about **love**. The illustrations should make people feel warmth, a little joy and tenderness: never sadness, never fear, never "memorial".

## What we need

An original illustrated cast and set of scenes for the landing page (desktop and mobile), designed to be animated on scroll. The full story is in `docs/landing-page-story.md`; the scenes below follow it.

### Characters
1. **The family:** a parent (the person building the vault), their partner, their daughter **Mary** at four ages (about 4, 10, 15 and 25), and a grandparent. They should be inclusive and warm, with varied skin tones from a natural range and simple, friendly faces.
2. **Biscuit, the family dog:** the one recurring character. A medium-sized, scruffy, lovable mongrel. Needed at three ages: puppy, adult, and old with a grey muzzle. Poses: asleep, sitting up and alert, wagging, trotting, nudging a box with his nose, resting by a door, lying down in profile at each of the three ages (the years, section 6), and lying on the doorstep at night (the closing scene). He is part of the family, **not a mascot**: he never talks, holds signs or appears in a logo.

### Objects
The **box**: a small linen-coloured keepsake box with a gold ribbon. It's the hero object. It needs to be shown closed, lid lifting, and open, with items dropping in; sealed, with the ribbon tied in a bow; and once more with the ribbon untied and no gold, for the day it opens. Also: envelopes addressed by hand, one letter that rises out of the open box, a phone showing an app screen (we supply the screen), a key that splits into three pieces, a kitchen table with a laptop and scattered papers, a lamp.

### Scenes (each in **landscape 16:9 and portrait 9:16**, composed for each, not cropped)
1. **The street at dusk** → **the house** → **the lit window** → **the family at the kitchen table** with Biscuit asleep underneath. These are separate layers for a continuous zoom (see "Technical" below).
2. **The growth rings:** concentric rings (like a tree's) that the camera travels through, with space beside each ring for a short label.
3. **The kitchen table at night:** an empty chair, scattered papers, one lamp. Quiet, not tragic.
4. **Mary through the years:** at 4, 10 and 15 for the messages section, and at about 25 receiving her letter.
5. **The house at night, every light on,** with old Biscuit on the doorstep (the closing scene). It is the zoom scene again, later the same night, on the same layers: see "The house at night" below.
6. **Ambient life:** a bird on the roof, three to five clouds, a tree, and a small ball on the kitchen table. These move on their own; "Parts for animation" below lists exactly how each must be split.
7. **The day the box opens:** the hall of the same house, years on. Mary, about 25, stands by the box; old Biscuit rests by the door. Quiet and still, with no gold: see "The day the box opens" below.
8. **Biscuit through the years:** the same dog three times, a puppy, grown, and old with a grey muzzle, each a small picture of its own.

## Style

- **Flat and rounded.** Simple geometric shapes with soft corners. No gradients, no 3D, no photorealism, no texture noise.
- **Line:** 2px outlines in deep plum-brown ink (`#2a1b1f`), or none where shapes are cut from colour blocks.
- **Palette: only these colours.**

  | Name | Hex | Use |
  |---|---|---|
  | Linen | `#fbf6ef` | Background, the box |
  | Paper | `#fffdfa` | Light surfaces |
  | Blush | `#f6dfd6` | Soft tints, skin highlights |
  | Heartwood | `#b4432f` | The brand colour: warm clay-rose |
  | Keepsake | `#4a2a3a` | Deep plum: night, weight |
  | Lantern | `#e3a64a` | Gold: the ribbon, lamplight |
  | Sage | `#557052` | Plants, growth |
  | Ink | `#2a1b1f` | Lines, dark details |

  A small range of warm, natural skin tones may be added. Nothing else.
- **Faces:** minimal, with dot eyes and a small curve for a smile. Expressive through posture more than detail.
- **Feeling:** a children's picture book for adults: tender, warm, gently funny. Think of the warmth of Headspace or Duolingo's charm, but in **our own** style; don't imitate either.
- **Must also work in dark mode.** The night scenes should sit on deep plum-brown (`#1c1416`) without looking muddy.

## Avoid

Gravestones, flowers-and-doves funeral imagery, black clothing, rain on windows, crying, hospitals, anything distressing. No brand mascots, no stock-illustration "corporate people", no gradients.

## Technical

- **Format:** layered **SVG** (named layers and groups), plus the source files (Figma preferred).
- **The zoom scene** (street → house → window → table → rings → box) must be delivered as separate layers aligned on one shared centre point, so we can scale through them continuously.
- **Biscuit:** delivered so he can be animated in **Rive** (separate parts: head, ears, body, legs, tail). Building the Rive file is a welcome add-on.
- Keep shapes simple enough that each SVG stays small (under ~80KB per scene where possible).

## Parts for animation (the zoom scene)

The street, house and kitchen are alive while the page sits still: clouds drift, the tree sways, the bird hops, the family breathes and blinks, Biscuit's ear twitches, and a ball rolls off the table. The code finds each moving part **by the name of its group**, so the names below must be used exactly, on a group (`<g>`) of their own. Anything not listed can be merged into the background.

### Artboards and the shared centre

Each scene is drawn twice. Coordinates in this section are on these two boards.

| | Board | Shared centre (every layer scales about it) |
|---|---|---|
| Landscape | 1600 × 900 | x 1088, y 450 (68% across, 50% down) |
| Portrait | 900 × 1600 | x 450, y 576 (50% across, 36% down) |

The lit window, the kitchen table top and the box all sit on the shared centre.

### Bleed

- **Portrait needs extra art on three sides.** Tablets show more to the left and right than a phone does, and tall phones show more below. Draw every portrait layer from **x −400 to x 1300** (400 past each side of the 900 board) and down to **y 2000** (400 below the board). Sky, street, kitchen wall and floor all carry on; nothing important sits out there.
- **Landscape** needs no bleed on the street and house. The **kitchen** is seen from outside before it fills the screen, so its wall and floor colours must be flat colours we can carry on past every edge in code.

### The parts

A **pivot** is the point a part turns or stretches about. Place it where given, relative to the part: the coordinates are where it falls on our placeholder art, as a guide to what we mean. If your drawing moves a part, move its pivot with it and tell us the new point.

| Group name | What it is | How it moves | Pivot | Pivot on the placeholder (landscape · portrait) |
|---|---|---|---|---|
| `cloud` | One cloud. One group each. | Drifts slowly across the sky and comes back in from the other side. | None | n/a |
| `tree` | The whole tree: holds the three groups below. | Sways a degree or two. | The foot of the trunk, where it meets the ground. | 690, 700 · 847, 1000 |
| `tree-trunk` | The trunk. | Moves with the tree. | None | n/a |
| `tree-canopy` | The main mass of leaves. | Moves with the tree. | None | n/a |
| `tree-leaf` | A smaller clump of leaves at the edge of the canopy. Two or three, one group each. | Each turns a few degrees, out of step with the others. | The middle of the canopy. | 690, 500 · 847, 790 |
| `bird` | The whole bird: holds the two groups below. | Hops on the spot, and now and then flies to another perch. | None | n/a |
| `bird-body` | Body, wings, tail, feet. | Moves with the bird. | None | n/a |
| `bird-head` | Head and beak. | Flips to face the other way, as a mirror image. | The centre of the head. | 1065, 113 · 462, 157 |
| `window-light` | The wash of lamplight in the window, seen from the street. | Its brightness wavers very slightly. | None | n/a |
| `lamp-light` | Each lit shape in the kitchen: the pendant shade, the lamp on the sideboard. One group each. | Its brightness wavers very slightly. | None | n/a |
| `person` | One family member, seated: holds the two groups below. One group per person. | Breathes: grows by about 1%. | Where they sit: the bottom centre of the body. | per person |
| `person-head` | Head, hair and face. | Tilts 3° to 6° to one side and back. | The base of the head, at the neck. | per person |
| `person-eyes` | Both eyes, and nothing else. | Blinks: squashes flat and opens again. | Midway between the eyes. | per person |
| `person-hand` | A hand holding a cup, **drawn in front of the table**, so outside its `person` group. | Lifts the cup: rises by most of its own height and tips 10°. | The wrist. | per person |
| `biscuit` | The whole dog, asleep: holds the four groups below. | Stays where it is. | None | n/a |
| `biscuit-body` | Body and legs. | Breathes: rises by about 5%. | On the floor, under the middle of the body. | 1080, 698 · 440, 1004 |
| `biscuit-head` | Head and muzzle: holds the ear. | Rises a touch with each breath. | None | n/a |
| `biscuit-ear` | The ear we can see. | Twitches: flicks about 14° and back. | Where the ear joins the head. | 1150, 640 · 523, 932 |
| `biscuit-tail` | The tail. | One slow wag: about 16°. | Where the tail joins the body. | 1004, 660 · 349, 958 |
| `ball` | The ball. | Rolls off the table, drops, bounces twice and stays on the floor. It turns as it goes. | Its centre. | 846, 427 · 178, 551 |

**Who is who.** Each `person` and each `person-hand` also carries a name so that a hand lifts with the right person: `mum`, `you`, `partner`, `mary`. In the placeholder only `mum` and `you` have a cup.

**Stars and dust.** The first stars in the dusk sky and the dust in the lamplight are tiny dots we draw in code. Leave them out.

### The bird's perches

The bird is drawn on the ridge of the roof and flies between three perches. Each is a spot where its feet can rest, so keep these clear and flat enough to stand on. The points are where the feet touch.

| Perch | Landscape | Portrait |
|---|---|---|
| The ridge (where it is drawn) | 1055, 139 | 450, 189 |
| The top of the chimney | 1213, 176 | 618, 226 |
| Part-way down the left slope of the roof | 930, 212 | 300, 273 |

It flies in an arc about twice its own height, so leave clear sky above the roof between the perches. If the roof or chimney moves in your drawing, tell us where the three perches are.

### The clouds

- **Four in landscape, three in portrait.** Each is one soft, flat shape: a few overlapping round puffs on a flat or gently rounded base. **Fill only, no outline.**
- **Colour:** Paper by day. At night, a soft tint of Keepsake over the night sky, so they sit back rather than glow.
- **Size:** between 6% and 12% of the scene's width, all different.
- **Position:** spread across the sky with clear gaps, **each at its own height**, so no two ever cross as they drift at different speeds. None in the top strip the navigation covers (the top 8% of the board).
- They cross the whole sky in one to two minutes and wrap round, so the sky behind them must be clean from edge to edge, including the portrait bleed.

### The ball

- Small and Heartwood, with **one mark on it** (a seam or a stripe) so we can see it turn. On the placeholder its radius is 13 on the landscape board and 15 on the portrait board.
- It starts **resting on the left end of the kitchen table**, touching the table top, close enough to the edge to roll off.
- It needs a clear path: nothing on the floor between the table's edge and where it stops, and plain wall behind the drop. On the placeholder:

| | Rests on the table | Table edge | Floor | Stops |
|---|---|---|---|---|
| Landscape | centre 846, 427 | x 828 | y 700 | centre 708, 687 |
| Portrait | centre 178, 551 | x 170 | y 990 | centre 140, 975 |

- In portrait it stops close to the table leg, because a phone crops the sides of the room. Keep that spot inside the middle 620 of the board (x 140 to 760).
- Biscuit sleeps through it.

### The kitchen table at night (scene 3)

The same room as the zoom scene, on the same two boards, with the table in the same place. Mary's mum sits where she sat (landscape x 1270 · portrait x 650) with a laptop and a notepad; Dad's chair (x 1025 · x 383) is empty. One lamp is on: the pendant. Colours are Keepsake and Linen only: no Lantern, no Heartwood. Quiet, not tragic: nobody is crying or in distress.

We crop this scene to a panel around the table, so keep everything that matters inside these areas and let the wall and floor carry on past them as flat colour:

| | Area that always shows |
|---|---|
| Landscape | x 798 to 1378, y 150 to 730 |
| Portrait | x 140 to 760, y 120 to 1045 |

| Group name | What it is | How it moves | Pivot |
|---|---|---|---|
| `lamp-light` | The pendant shade and its light, in one group. | Its brightness wavers very slightly. | None |
| `person` | Mary's mum, seated: holds the two groups below. No separate eyes or hand here. | Stays where she is. | None |
| `person-body` | Her body, from the shoulders down. | Breathes: the chest rises by about 4% and fills out a touch, in for two seconds, out for a little longer, then a short rest. | Where she sits: the bottom centre of the body. |
| `person-head` | Head, hair, neck and face. | Rides up on the shoulders with each breath. | None |
| `biscuit` | The dog, lying still under the table: holds `biscuit-body` and `biscuit-head` as above. No separate ear or tail. | Breathes. Nothing else. | As above. |
| `paper` | One scattered sheet. **One group each**; seven on the placeholder (five on the table, two on the floor). | Lifts, straightens and flies into the box. | Its centre. |
| `box` | The box from the hero, open, **without its ribbon**, standing on the table at Dad's place. | Fades in, then the papers fly into it. | None |
| `box-papers` | Inside `box`: the top edges of the sheets, showing above the rim. | Fades in once the papers have landed. | None |

Draw the front of the box last, so the sheets pass behind it as they drop in. Keep the table clear at Dad's place for the box, and keep clear air above it for the papers' flight.

### The open box, with Biscuit beside it (sections 3 and 4)

One board, 400 × 280, used on every screen. The box stands at x 190 to 350, y 152 to 244, with its ribbon, open; the growth rings are centred on the middle of the box (270, 198). In section 3 Biscuit lies to its left with his head towards it. In section 4 he isn't there: three envelopes wait where he lay.

It is drawn in three layers, so that things can drop in between them: the rings; then Biscuit, what is in the box, the envelopes and the lid; then the front of the box, last.

| Group name | What it is | How it moves | Pivot |
|---|---|---|---|
| `biscuit` | The whole dog, awake, lying down: holds `biscuit-tail` and `biscuit-up`. | Breathes; ear and tail twitch now and then, as in the zoom scene. | None |
| `biscuit-up` | Everything that lifts when he sits up: holds `biscuit-body` and `biscuit-head`. | Sits up, once, when the card about him lands: turns about 28°. | His hips: 62, 240 |
| `biscuit-perk` | Inside `biscuit-head`: holds `biscuit-ear`. | The ear lifts when a card appears, and drops again. | Where the ear joins the head: 146, 198 |
| `biscuit-tail` | The tail. | Wags when a card lands. | Where the tail joins the body: 40, 228 |
| `box` | Each piece of the box: what's in it, its lid, its front. **Three groups with this name**, one per layer. | All squash together, slightly, each time the box catches something. | The foot of the box: 270, 244 |
| `box-lid` | The lid, lifted, with its untied ribbon. Drawn in front of what's in the box. | Section 4: begins to close, from 32° open to 14°. | The back left corner of the rim: 188, 152 |
| `box-item` | The top of one thing in the box, showing above the rim. **One group each**; five. | Rises into view when that thing lands. | None |
| `envelope` | Section 4 only: one of Dad's letters, waiting beside the box. **One group each**; three. | Lifts, slides in under the lid and drops behind the front of the box. | Its centre |

Keep clear air above the box for what flies into it.

### Mary through the years (section 4)

One board, 320 × 240, with the floor at y 196. Mary stands in one place, by a door frame where her height is marked in pencil, at about 4, 10 and 15. The three of her are drawn on top of each other and only one shows at a time: each fades into the next. No Biscuit.

| Group name | What it is | How it moves | Pivot |
|---|---|---|---|
| `mary-4`, `mary-10`, `mary-15` | Mary at each age, standing. Each holds a `person` (with `person-head` and `person-eyes`, as in the zoom scene). | Fades in and out; breathes and blinks. | As `person`. |
| `mary-mark` | A pencil mark on the door frame at the top of her head. **One group each**; three. | Fades in as she reaches that height. | None |

The waveform of the voice note and the still from the video are placeholders too. The handwritten addresses ("For Mary, on her 18th birthday") are set in type on the cards, not drawn.

### The sealed box and the key (section 5)

**The box, sealed.** The same board as the open box, 400 × 280, with the box in the same place (x 190 to 350, y 152 to 244). The lid arrives part-closed, comes down the rest of the way, and the ribbon ties itself in a bow on top. This section sits on a Keepsake band: there the box is drawn in Paper with the gold ribbon, and outlined in Keepsake instead of Ink, so it reads as cut out of the band. The rings are drawn in code.

| Group name | What it is | How it moves | Pivot |
|---|---|---|---|
| `box` | The whole box: holds everything below. | Takes the weight when the lid lands: squashes a touch, once. | The foot of the box: 270, 244 |
| `box-lid` | The lid (x 184 to 356, y 124 to 152) with the ribbon across it: holds `bow`. | Comes down from part-closed to shut. | The back left corner of the rim: 188, 152 |
| `box-item` | The top of one thing in the box, showing above the rim. **One group each**; five. | Seen until the lid is down. | None |
| `bow` | The tied ribbon on the middle of the lid: holds the two groups below. | Appears as the ribbon ties itself. | None |
| `bow-loop` | One loop of the bow. **One group each**; two. | Grows out of the knot. | The knot: 270, 121 |
| `bow-knot` | The knot between the loops. | Appears first. | The knot: 270, 121 |

Draw the lid and the bow so the bow can be left off: the same box is used with the ribbon untied in "The day the box opens".

**The key.** One key, delivered as **three separate pieces**, each on its own board of 64 × 40, lying on its side with the round end to the left:

| Piece | What it is |
|---|---|
| The bow | The round end you hold, with the start of the shaft. |
| The shaft | The straight middle. |
| The bit | The end of the shaft, with the teeth. |

- The pieces are cut **square** where they meet (the shaft is 10 thick, from y 15 to y 25, and runs to the edge of each board), so the three sit edge to edge as one key and come apart cleanly.
- One flat colour, Linen, with no outline: the key is cut out of the Keepsake band.
- Keep it plain enough to read when it is 45px tall. On a phone the whole key stands upright (we turn each piece a quarter turn) and comes apart top to bottom, so it must read both ways up.
- Nothing else is drawn here: the three holders of the pieces are words, not pictures.

### Biscuit through the years (section 6)

Biscuit three times, each lying down in profile, **facing right** (the way the years run), each on a small board of its own. They sit on a timeline beside the years 2026, 2030 and 2034, so each must read at about 100px wide.

| Age | Board | What changes |
|---|---|---|
| Puppy | 96 × 60 | Small, and mostly head. Tail up. |
| Grown | 128 × 68 | As in the zoom scene. |
| Old | 132 × 66 | Lower to the ground, chin nearly down, tail lying behind him, a pale grey muzzle. |

Each is split the same way as the Biscuit in the zoom scene, so he breathes and twitches the same way, with one more group on the old dog:

| Group name | What it is | How it moves | Pivot (puppy · grown · old) |
|---|---|---|---|
| `biscuit` | The whole dog: holds the groups below. | Stays where it is. | None |
| `biscuit-tail` | The tail. | One slow wag. | Where the tail joins the body: 20, 44 · 24, 48 · 22, 54 |
| `biscuit-body` | Body and legs. | Breathes. | On the ground, under the middle of the body: 44, 58 · 62, 66 · 62, 65 |
| `biscuit-head` | Head and muzzle: holds the ear, and on the old dog `biscuit-muzzle`. | Rises a touch with each breath. | None |
| `biscuit-ear` | The ear we can see. | Twitches. | Where the ear joins the head: 69, 20 · 100, 25 · 101, 36 |
| `biscuit-muzzle` | **Old dog only:** the pale patch round his mouth. | Never moves. | None |

The old dog is used twice more: resting by the door in "The day the box opens" (in a quieter coat, and perfectly still) and on the doorstep in "The house at night".

### The day the box opens (section 7)

The hall of the same house, years on. Mary, about 25, stands beside a small table with the box on it. The door frame still has her three heights marked on it in pencil (from "Mary through the years"), and Biscuit, old now, lies by the door. A message has reached her; the lid lifts, slowly, and her letter rises out.

**This scene is for a family in loss, so it follows different rules from every other scene:**

- **No gold and no Heartwood.** Keepsake, Linen, Paper and the line colour only. Mary's clothes and the box's ribbon are Keepsake; Biscuit's coat is a pale neutral, not gold.
- **Nothing moves but the lid and the letter.** Nobody breathes, blinks or twitches. Biscuit and Mary keep their group names (`biscuit`, `person`) so the art matches the rest, but we leave them still.
- Mary is calm: a quiet, closed mouth, not a smile. Nobody is crying or in distress.
- The ribbon is **untied**: no bow.

It is drawn on the box's own board (the box at x 190 to 350, y 152 to 244), with the floor at **y 300** and a small table under the box (top at y 244, x 164 to 376). Two compositions:

| | Board | Left to right |
|---|---|---|
| Landscape | x −150 to 390, y −130 to 330 (540 × 460) | The door (x −130 to −26), Biscuit lying by it (x −74 to 58), Mary (centred on x 110), the box on its table. |
| Portrait | x 70 to 390, y −120 to 380 (320 × 500) | The door (x 84 to 188) behind Mary (centred on x 124), the box on its table; Biscuit lies in front of them on the floor (x 86 to 218). |

The wall is a flat colour and the floor runs on past every edge, so the scene can stand on the bottom edge of a panel of any shape. The pencil marks are on the door frame at 86, 118 and 148 above the floor.

| Group name | What it is | How it moves | Pivot |
|---|---|---|---|
| `box-lid` | The lid, with the untied ribbon across it. | Lifts, slowly (1.6 seconds), to about 36° open. | The back left corner of the rim: 188, 152 |
| `letter` | Mary's letter: one envelope, inside the box. **Drawn between the inside of the box and its front.** | Rises out of the open box by about 58, and stops above the rim (centred near 304, 114), tilted about 6°. | None |

Keep clear air above the box for the lid and the letter, and keep the top right of the landscape scene plain: the message to Mary sits there as a card.

### The house at night (section 10, the closing scene)

The zoom scene again, played backwards: from the box, out through the rings, the kitchen, the window and the house, to the street. It uses **the same boards, the same shared centre and the same layers** as the zoom scene, with these differences. Everything not listed stays as it is, including every group name, pivot and perch.

**Night colours.** We make the night by swapping the palette in code, so every fill and line must be exactly one of the palette colours, with no blends. These are the night values, if you want to check your drawing against them:

| Name | Night |
|---|---|
| Linen | `#1c1416` |
| Paper | `#2b2023` |
| Blush | `#3a2529` |
| Heartwood | `#ea8670` |
| Keepsake | `#c9a3b6` |
| Lantern | `#e9b562` |
| Sage | `#9db894` |
| Lines | `#f6ede6` |

**The street.** Every window on the neighbours' houses is lit (Lantern). In portrait, two more lit windows show at the edges: x 20 to 96, y 620 to 696 and x 812 to 888, y 590 to 666. The road has no markings, and nothing sits on it or below it: the closing words and the button are set there.

**The house.** Every light is on:

| | Landscape | Portrait |
|---|---|---|
| The glass at the top of the front door, lit | x 896 to 956, y 562 to 596 | x 562 to 642, y 808 to 854 |
| The porch lamp over the door | centre 926, 524, radius 9 | centre 602, 758, radius 12 |
| Old Biscuit, lying on the doorstep | x 846 to 950, on the step at y 700 | x 492 to 634, on the step at y 1000 |

- The porch lamp is a group named `window-light`, so its brightness wavers like the kitchen window's.
- Biscuit is the old dog from "Biscuit through the years", in his gold coat, with the same groups and pivots, lying in front of the door, facing right. He breathes; his ear and tail twitch now and then.
- The bird is still on the roof.

**The kitchen**, seen through the window on the way out: the same family at the table. **Biscuit isn't under the table** (he is on the doorstep), and the **ball is on the floor** where it came to rest (landscape centre 708, 687 · portrait centre 140, 975), not on the table.

## Deliverables

1. Style exploration: two or three directions for Biscuit, the family and the box. We pick one before full production.
2. Characters (all ages and poses above).
3. Scenes 1–8, landscape and portrait (scene 8 is three small pictures, used at every size).
4. Source files and an export of every asset as SVG.

## Contact

Justice Eziefule, founder, afterbox (afterbox.co.uk)
