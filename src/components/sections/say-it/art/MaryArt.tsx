import type { ReactNode } from "react";
import { Part } from "../../hero/art/Part";
import { Person } from "../../hero/art/TableArt";

/**
 * PLACEHOLDER. Mary growing up, by the door frame where her height is marked
 * in pencil: at about 4, 10 and 15 (see docs/illustrator-brief.md, "Mary
 * through the years"). Blocks only; the commissioned art replaces it part for part.
 *
 * One board, 320 × 240, with the floor at y 196. She stands in one place and
 * the three of her are drawn on top of each other; only one shows at a time.
 *
 * Moving parts, by name:
 *   mary-4, mary-10, mary-15   Mary at each age: each holds a `person`, who
 *                              breathes and blinks (../../hero/ambient/behaviours.ts)
 *   mary-mark                  a pencil mark on the door frame, one per age
 *
 * The story moves them, not the clock: the panel she is in is marked
 * `data-grown` once it is on screen, and she grows up there, one slow fade
 * at a time (opacity only). Scrolling back takes her back. Reduced motion: she is 15 from the first paint.
 */
const floor = 196;
const x = 150;

/** How long one age takes to give way to the next: slower than anything else on the page so far. */
const fade = "transition-opacity duration-1800 ease-gift";

/** When each change starts, once she is on screen. */
const toTen = "delay-500";
const toFifteen = "delay-2000";

type AgeProps = {
  /** Head radius, and the size of the block she is drawn as. */
  r: number;
  width: number;
  height: number;
};

/** Mary, standing on the floor. */
function Mary({ r, width, height }: AgeProps) {
  // Person is placed by the centre of its head; work back from the feet.
  const shoulders = floor - height;
  return <Person who="mary" x={x} y={shoulders - r + 6} r={r} width={width} height={height} tone="fill-lantern" />;
}

/** A pencil mark on the door frame, at the top of her head. */
function Mark({ y, className }: { y: number; className?: string }) {
  return (
    <Part name="mary-mark" className={className}>
      <path d={`M226 ${y}h18`} className="fill-none" />
    </Part>
  );
}

function Fades({ name, className, children }: { name: string; className: string; children: ReactNode }) {
  return (
    <Part name={name} className={`${fade} ${className}`}>
      {children}
    </Part>
  );
}

// Reduced motion holds the last frame: what has left is gone, what stays is there.
const appears = "opacity-0 group-data-grown/mary:opacity-100";
const stays = "motion-reduce:opacity-100!";
const leaves = "group-data-grown/mary:opacity-0 motion-reduce:opacity-0!";

export function MaryArt() {
  return (
    <svg
      viewBox="0 0 320 240"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden
      focusable="false"
      className="absolute inset-0 size-full stroke-ink stroke-2 [stroke-linecap:round] [stroke-linejoin:round]"
    >
      {/* floor */}
      <rect x="-200" y={floor} width="720" height="60" className="fill-linen" />
      {/* door frame */}
      <rect x="226" y="-10" width="150" height={floor + 10} className="fill-linen" />

      <Mark y={floor - 86} />
      <Mark y={floor - 118} className={`${fade} ${toTen} ${appears} ${stays}`} />
      <Mark y={floor - 148} className={`${fade} ${toFifteen} ${appears} ${stays}`} />

      <Fades name="mary-4" className={`${toTen} ${leaves}`}>
        <Mary r={20} width={52} height={52} />
      </Fades>
      {/* At 10 she comes and goes: one group fades her in, the one inside it fades her out. */}
      <Fades name="mary-10" className={`${toTen} ${appears}`}>
        <g className={`${fade} ${toFifteen} ${leaves}`}>
          <Mary r={23} width={60} height={78} />
        </g>
      </Fades>
      <Fades name="mary-15" className={`${toFifteen} ${appears} ${stays}`}>
        <Mary r={25} width={68} height={104} />
      </Fades>
    </svg>
  );
}
