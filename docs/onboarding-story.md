# afterbox onboarding — the story

The feeling: someone gently helping you do the most loving thing you'll ever do, and making it feel easy. It starts with a person you love, not with forms. By the end, one person you love already has a sealed gift, and you want to make one for everyone else.

Principles
- People first. The first question is about someone you love, not about you.
- No sign-up wall. You make something real before we ask who you are.
- One question per screen. Small, quick, warm.
- Never ask for other people's details too early. Name and relationship only; contact details are always optional and "add later" is as visible as "add".
- No executor in onboarding. That comes later, in /home, once trust is built.
- Voice and letters only (no video).
- Love and necessity in every line. Never lead with "vault".
- Gift mode throughout: rings, ribbon, gentle rewards. Never fear.

Steps

There is no welcome screen. The landing page has already said what this is, so "Build their gift" opens straight on the first question.

1. Who came to mind? — /start/someone
"Think of someone you love. Who came to mind first?"
- Their name (one field).
- How they're related, as chips: Partner · Daughter · Son · Mum · Dad · Sister · Brother · Friend · Someone else.
As they type, a gift box appears with the name on its handwritten tag and one ring around it.
Button: "This is for [Mary]". Pressing it is what starts the guest session; nothing is kept before then.
Quiet link: "Already started a gift? Sign in".

2. Say something to them — /start/message
"Say something to [Mary]. Something only you could say."
Gentle prompts they can tap for ideas: "Something you've never said out loud" · "What to remember on a hard day" · "A memory only you two share".
- Record a voice note (up to 3 minutes): record, stop, play back, record again. Or "Write it instead" for a letter.
- Name the envelope (font-note), with suggestions: "For [Mary], on a hard day" · "For [Mary], for whenever you need me".
Button: "Seal it for [Mary]". The envelope drops into the box, a new ring grows, a brief glow:
"Sealed for [Mary]. Only she will hear it, when the time comes."

3. Keep it safe — /start/keep-safe (sign-up)
"Let's keep this safe for [Mary]."
- Email → 6-digit code. (Google sign-in appears here once it's set up.)
- The guest account and everything made so far move to the real account.
Trust lines underneath: "Not even afterbox can open your vault." · "We never sell your data."
Quiet link: "Already started a gift? Sign in".

4. Reaching them — /start/reach
"When the time comes, how should we reach [Mary]?"
- Email and/or phone, both optional.
- "Add later" is as visible as "Save".
Small print: "We won't contact [Mary] now. Only when the time comes, and only if you'd like us to."

5. One thing they'd need to find — /start/find
"Where does your main bank account live?"
- Bank chips: Barclays · HSBC · Lloyds · NatWest · Santander · Nationwide · Monzo · Starling · Other (type a name).
- Optional: "Skip for now" (shown until a bank is chosen).
Reward: the moment a bank is chosen it lands on a small shelf labelled "What they'll need to find": "One less thing for them to search for." It is saved once, on "Continue". A name that looks like a number or a password is refused kindly, and never goes on the shelf.

6. Gentle nudges — /start/nudges
"Life changes. Want a gentle nudge when it does?"
Example: "You bought a home. Add it?"
- Toggle: reminder emails (on by default, easy to turn off).
For now this is the last step: "Continue" finishes onboarding and goes to /home, on the free plan.

7. Who else? — /start/everyone (the offer). Not shown for now; everyone starts on the free plan.
It is switched off by `offerInOnboarding` in `src/lib/onboarding.ts`; the screen is kept for later.
"[Mary] has her gift. Who else would you build one for?"
Two equal choices, the same size and weight:
- "Build gifts for everyone": everyone you love, unlimited voice notes and letters, afterbox spotting what you'd forget, and a step-by-step guide for your executor. [£price] a month or [£price] a year (placeholders).
- "Keep going free": one person you love.
Promise underneath, always: "Whatever you choose, [Mary]'s message will always reach her."
Payments aren't built yet: choosing the paid option records interest and shows "Paid plans open soon. We'll save your place and let you know." Then continue.

8. Home — /home
The transition carries [Mary]'s box into /home: their people as gift boxes, the practical shelf, and soft outlines suggesting what to add next.
