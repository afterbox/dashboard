import type { ReactNode } from "react";
import { BankConnected, Kept, Noticed, paper, Record } from "./cards";
import type { Step } from "./use-beats";

/**
 * The four beats of section 3, in order. Each is a few words and the cards
 * that drop into the box.
 *
 * `arrives` is how its cards come in, so no two beats start the same way:
 *   turn    one card turns over (the bank, then what afterbox noticed)
 *   slide   they slide in from the side, one after the other
 *   stand   it stands up from flat
 *   settle  it comes in tilted and straightens
 * Every one of them ends with the same drop.
 */
type Beat = {
  id: string;
  label: string;
  line: string;
  /** Said under the box once the beat has landed. */
  added: string;
  arrives: "turn" | "slide" | "stand" | "settle";
  /** The face a card shows first, before it turns over. `turn` only. */
  first?: ReactNode;
  /** The cards that drop. `pressed`: a button on it is going down. */
  cards: readonly ((pressed: boolean) => ReactNode)[];
  /** A button is pressed before it drops. */
  pressed?: boolean;
};

export const beats: readonly Beat[] = [
  {
    id: "accounts",
    label: "Accounts",
    line: "Connect your bank. We'll notice what you'd forget.",
    added: "One less thing for them to search for.",
    arrives: "turn",
    first: <BankConnected />,
    cards: [(pressed) => <Noticed pressed={pressed} />],
    pressed: true,
  },
  {
    id: "pensions",
    label: "Pensions and policies",
    line: "Old pensions, quiet policies. Nothing left for them to chase.",
    added: "Mary won't have to guess.",
    arrives: "slide",
    cards: [
      () => (
        <Record
          kind="Pension"
          who="Mary"
          title="From your first job"
          note="Who it's with, and the reference they'll ask for."
        />
      ),
      () => (
        <Record
          kind="Policy"
          who="Jo"
          title="Home insurance"
          note="Who to call, and where the papers are kept."
        />
      ),
    ],
  },
  {
    id: "crypto",
    label: "Crypto",
    line: "Tell them where to look, so it still reaches them.",
    added: "Kept safe for Jo.",
    arrives: "stand",
    cards: [
      () => (
        <Kept
          kind="Crypto wallet"
          who="Jo"
          title="Where the key lives. Never the key itself."
          label="Where to look"
          value="The blue tin, top shelf of the study."
        />
      ),
    ],
  },
  {
    id: "wishes",
    label: "Wishes",
    line: "And the small things only you'd think of.",
    added: "Biscuit's looked after, too.",
    arrives: "settle",
    cards: [
      () => (
        <Kept
          kind="A wish"
          title="What happens to Biscuit?"
          label="Your answer"
          value="He goes to Mum's. Long walks, no cheese."
        />
      ),
    ],
  },
];

/** Whether each beat has a button to press before it drops. */
export const presses = beats.map((beat) => beat.pressed ?? false);

// With reduced motion, CSS holds every card where it ends up, from the first paint.
const still = "motion-reduce:transform-none! motion-reduce:translate-none! motion-reduce:rotate-none! motion-reduce:opacity-100!";

/** How a card waits before it has arrived, and how it moves when it does. */
const arrivals = {
  slide: { moves: "transition-[translate,opacity] duration-600 ease-play", waits: "-translate-x-10 opacity-0" },
  stand: {
    moves: "origin-bottom transition-[transform,opacity] duration-700 ease-play",
    waits: "[transform:perspective(60rem)_rotateX(-78deg)] opacity-0",
  },
  settle: {
    moves: "transition-[translate,rotate,opacity] duration-600 ease-play",
    waits: "translate-y-6 rotate-6 opacity-0",
  },
} as const;

type CardsProps = { beat: Beat; step: Step };

/**
 * A beat's cards, in the page. Each `data-card` is where its flying copy
 * starts from (see ./drop.ts). Once a beat has dropped, the cards are in the
 * box, and a dashed outline is left where they lay.
 */
export function BeatCards({ beat, step }: CardsProps) {
  const arrived = step >= 1;
  const gone = step === 3;

  return (
    <div data-slot className="relative mt-6 grid max-w-100 gap-3">
      {beat.cards.map((face, i) => (
        // Reduced motion: nothing drops, so the cards stay to be read.
        <div key={i} data-card className={gone ? "invisible motion-reduce:visible" : ""}>
          {beat.arrives === "turn" ? (
            <div className="perspective-distant">
              <div
                className={`grid transition-transform duration-700 ease-play transform-3d motion-reduce:rotate-y-180! ${
                  arrived ? "rotate-y-180" : ""
                }`}
              >
                <div className={`${paper} [grid-area:1/1] backface-hidden`}>{beat.first}</div>
                <div className={`${paper} [grid-area:1/1] rotate-y-180 backface-hidden`}>{face(step === 2)}</div>
              </div>
            </div>
          ) : (
            <div
              className={`${paper} ${arrivals[beat.arrives].moves} ${still} ${i > 0 ? "delay-150" : ""} ${
                arrived ? "" : arrivals[beat.arrives].waits
              }`}
            >
              {face(false)}
            </div>
          )}
        </div>
      ))}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 rounded-lg border border-dashed border-line transition-opacity duration-480 ease-state motion-reduce:hidden ${
          gone ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}

/** The copies that fly: one per card, as it looks when it leaves. They wait unseen in the box scene. */
export function Flyers() {
  return beats.map((beat, b) =>
    beat.cards.map((face, i) => (
      <div
        key={`${beat.id}-${i}`}
        data-flyer={b}
        className={`${paper} pointer-events-none absolute top-0 left-0 opacity-0 will-change-transform`}
      >
        {face(false)}
      </div>
    )),
  );
}
