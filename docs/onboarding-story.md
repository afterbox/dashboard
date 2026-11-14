# afterbox onboarding — the story

The feeling: someone gently helping you do the most loving thing you'll ever do, and making it feel easy. It starts with a person you love, not with forms. By the end, one person you love already has a sealed gift, and you want to make one for everyone else.

Principles
- People first. The first question is about someone you love, not about you.
- No sign-up wall. You make something real before we ask who you are.
- One question per screen. Small, quick, warm.
- Never ask for other people's details too early. A name is enough; how they're related is optional, and onboarding never asks for their email or phone.
- Almost nothing to do. Each screen shows only what is needed now; the next thing appears once the first is done, and anything secondary waits in a bottom sheet.
- No executor in onboarding. That comes later, in /home, once trust is built.
- Voice and letters only (no video).
- Love and necessity in every line. Never lead with "vault".
- Gift mode throughout: rings, ribbon, gentle rewards. Never fear.

Steps

There is no welcome screen. The landing page has already said what this is, so "Build their gift" opens straight on the first question.

1. Who came to mind? — /start/someone
"Think of someone you love. Who came to mind first?"
- To begin with: the question and one field, "Their name", large and ready to type in. Nothing else, and no button.
- As they type, a gift box appears with the name on its handwritten tag and one ring around it, and one line slides in: "[Mary] is your…" with chips.
  - On a phone: one row of small chips, Partner · Daughter · Son · Mum and "More". The row scrolls sideways; it never wraps. "More" opens a bottom sheet with Dad · Sister · Brother · Friend · Someone else. One tap chooses and closes, and the choice comes to the front of the row. "Someone else" takes a short word of their own ("Godmother").
  - From a tablet up: every chip in one wrapped group, and no sheet.
- How they're related is optional. Tapping the chosen chip again lets it go.
Button, once there is a name: "This is for [Mary]". Pressing it is what starts the guest session; nothing is kept before then.
Quiet link: "Already started a gift? Sign in".

2. Say something to them — /start/message
"Say something to [Mary]." and, under it, "Something only you could say."
- Before recording: one large round record button (the only big control in onboarding), and two small links, "Write instead" and "Need an idea?". No ideas on the screen, no envelope, no "Seal it".
- "Need an idea?" opens a bottom sheet: "Something you've never said out loud" · "What to remember on a hard day" · "A memory only you two share". The one they pick shows as a single quiet line, and names the envelope ("For [Mary], on a hard day") unless they have named it themselves.
- While recording (up to 3 minutes): the level, the time, and one stop button.
- After recording: a small player (play or pause, record again), the envelope with "For [Mary]" on its handwritten tag (font-note), and "Seal it for [Mary]". A small pencil renames the envelope in place; naming it is optional and there is never a field for it up front.
- Writing instead: a page that grows as they write. The same envelope and "Seal it" arrive with the first words. "Record instead" goes back.
Button: "Seal it for [Mary]". The envelope drops into the box, a new ring grows, a brief glow:
"Sealed for [Mary]. Only she will hear it, when the time comes." (With no relationship given: "Only they will…". We never guess at "she" or "he".)
One small button records or writes it again.

3. Keep it safe — /start/keep-safe (sign-up)
"Let's keep this safe for [Mary]."
- Email ("No password. We'll email you a code.") → 6-digit code. (Google sign-in appears here once it's set up.)
- The code screen asks for the code and nothing else: where it was sent, and two small links, "Send a new code" and "Change email".
- The guest account and everything made so far move to the real account.
Trust lines under the email field: "Not even afterbox can open your vault." · "We never sell your data."
Quiet link: "Already started a gift? Sign in".

4. One thing they'd need to find — /start/find
"Where does your main bank account live?"
- Bank chips: Barclays · HSBC · Lloyds · NatWest · Santander · Nationwide · Monzo · Starling · Other (type a name). On a phone: one row of the first four and "More", with the rest, and a bank of their own, in a bottom sheet, as on the first question.
- Optional: "Skip for now" (shown until a bank is chosen).
Reward: the moment a bank is chosen it lands on a small shelf labelled "What they'll need to find": "One less thing for them to search for." It is saved once, on "Continue". A name that looks like a number or a password is refused kindly, and never goes on the shelf.
For now this is the last step: "Continue" (or "Skip for now") finishes onboarding and goes to /home, on the free plan.

Set aside for now (kept in the code, not shown)

Three screens are not part of onboarding at the moment. Their addresses lead to wherever the person is, or to /home once they have finished. They are switched off in `src/lib/onboarding.ts` (`setAside` and `offerInOnboarding`).

- Reaching them — /start/reach
"When the time comes, how should we reach [Mary]?" Email and/or phone, both optional; "Add later" as visible as "Save". Small print: "We won't contact [Mary] now. Only when the time comes, and only if you'd like us to."
Nobody is asked for their person's email or phone in onboarding now.

- Gentle nudges — /start/nudges
"Life changes. Want a gentle nudge when it does?" Example: "You bought a home. Add it?" Toggle: reminder emails.
Reminder emails are not asked about in onboarding now. They stay on by default, and are turned off in /home's settings.

- Who else? — /start/everyone (the offer). Everyone starts on the free plan.
"[Mary] has her gift. Who else would you build one for?"
Two equal choices, the same size and weight:
- "Build gifts for everyone": everyone you love, unlimited voice notes and letters, afterbox spotting what you'd forget, and a step-by-step guide for your executor. [£price] a month or [£price] a year (placeholders).
- "Keep going free": one person you love.
Promise underneath, always: "Whatever you choose, [Mary]'s message will always reach her."
Payments aren't built yet: choosing the paid option records interest and shows "Paid plans open soon. We'll save your place and let you know." Then continue.

5. Home — /home
The transition carries [Mary]'s box into /home: their people as gift boxes, the practical shelf, and soft outlines suggesting what to add next.

On a phone
- No onboarding screen needs scrolling at 375 × 667 (nor at 320 × 568), apart from its sheets and a letter that has grown long. `node scripts/screenshots.mjs` says which would, and an end-to-end test checks it.
- Sizes: chips 36px tall, icon buttons 44px with 20px icons, fields and the main button 48px. Only the record button is big (88px).
- Icons only where they are instantly clear (record, stop, play, pause, record again, rename, back, close), each with a label for screen readers and a tooltip.
- Anything secondary is in a bottom sheet: paper, rounded top corners, a handle, swipe down to close.
- Nothing is laid over anything else. The main button sits at the bottom of the screen but is part of the page: on a screen longer than the phone it follows what comes before it.
