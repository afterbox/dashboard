import { paper, Tick } from "../fill-it/cards";
import type { Age } from "./BiscuitAges";

/**
 * The years in section 6, and what afterbox says in each. Product moments,
 * built from the tokens; nothing here can be pressed (the answers are drawn,
 * not real).
 *
 * The box was sealed in 2026, the year Mary was four (section 4). Every other
 * year after it something has changed, and afterbox asks, once, gently. The
 * years between are the yearly check-in: a minute, and nothing to do.
 */
export const sealedIn = 2026;

type Nudge = { kind: "nudge"; says: string; yes: string; no: string };
type CheckIn = { kind: "check-in"; kept: number };

export type Year = {
  year: number;
  /** Biscuit, drawn in this year at this age. */
  biscuit?: Age;
} & (Nudge | CheckIn);

export const years: readonly Year[] = [
  { year: 2028, kind: "nudge", says: "You bought a home. Add it?", yes: "Add it", no: "Not now" },
  { year: 2030, kind: "check-in", kept: 18, biscuit: "grown" },
  {
    year: 2032,
    kind: "nudge",
    says: "Mary turns 10 this year. Record something new for her?",
    yes: "Record",
    no: "Later",
  },
  { year: 2034, kind: "check-in", kept: 26, biscuit: "old" },
  {
    year: 2036,
    kind: "nudge",
    says: "A new payment to a pension provider. Is that yours?",
    yes: "Yes, add it",
    no: "Not mine",
  },
];

/** A nudge: one question, and two ways to answer it. The dot is afterbox speaking. */
export function NudgeCard({ says, yes, no }: Nudge) {
  return (
    <div className={`${paper} p-4!`}>
      <p className="flex items-center gap-2 text-small text-ink-muted">
        <span aria-hidden className="size-2 rounded-pill bg-heartwood" />
        afterbox noticed
      </p>
      <p className="mt-1.5 text-body font-medium text-pretty text-ink">{says}</p>
      <p className="mt-3 flex items-center gap-5 text-label">
        <span className="text-heartwood">{yes}</span>
        <span className="text-ink-muted">{no}</span>
      </p>
    </div>
  );
}

/** The yearly check-in: how much is kept, and that there is nothing to do. */
export function CheckInChip({ kept }: CheckIn) {
  return (
    <div className="flex items-center gap-2.5 rounded-md border border-line bg-paper py-2 pr-4 pl-3 shadow-rest">
      <Tick className="text-sage" />
      <p className="text-small text-ink-muted">
        <span className="block text-label text-ink">Yearly check-in</span>
        {kept} things kept. All up to date.
      </p>
    </div>
  );
}
