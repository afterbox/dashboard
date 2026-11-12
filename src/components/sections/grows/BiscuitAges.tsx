import { Part } from "../hero/art/Part";

/**
 * PLACEHOLDER. Biscuit at three ages, for the years in section 6: a puppy the
 * year the box was sealed, grown a few years on, and old, with a pale muzzle,
 * by the end. Rounded blocks only, the same ones as everywhere else; the
 * commissioned art replaces each part for part.
 *
 * Each is a small board of its own, lying down, facing right (the way the
 * years run). Section 7 draws the old dog once more, by the door, in a
 * quieter coat (Still mode has no gold) and perfectly still.
 *
 * Moving parts, by name (see ../hero/art/Part.tsx): the same as in the hero,
 * so he breathes and twitches the same way (../hero/ambient/behaviours.ts):
 *   biscuit (biscuit-tail, biscuit-body, biscuit-head (biscuit-ear))
 * The old dog also has biscuit-muzzle, which never moves.
 */
export type Age = "puppy" | "grown" | "old";

type Shape = {
  /** The board: width and height. Its ratio is what ./grows.css sizes. */
  board: readonly [number, number];
  tail: { d: string; pivot: readonly [number, number] };
  body: { cx: number; cy: number; rx: number; ry: number };
  head: { cx: number; cy: number; r: number };
  ear: { cx: number; cy: number; tilt: number };
  mouth: string;
  /** The pale patch round an old dog's mouth. */
  muzzle?: { cx: number; cy: number };
};

const shapes: Record<Age, Shape> = {
  // Small, and mostly head. His tail is up.
  puppy: {
    board: [96, 60],
    tail: { d: "M20 44q-11 -5 -8 -20", pivot: [20, 44] },
    body: { cx: 44, cy: 44, rx: 27, ry: 14 },
    head: { cx: 73, cy: 34, r: 17 },
    ear: { cx: 67, cy: 30, tilt: -22 },
    mouth: "M77 39q4 3 8 0",
  },
  grown: {
    board: [128, 68],
    tail: { d: "M24 48q-16 -6 -13 -24", pivot: [24, 48] },
    body: { cx: 62, cy: 48, rx: 42, ry: 18 },
    head: { cx: 105, cy: 40, r: 18 },
    ear: { cx: 98, cy: 35, tilt: -25 },
    mouth: "M109 45q4 3 9 0",
  },
  // Lower to the ground: his chin is nearly down, his tail lies behind him.
  old: {
    board: [132, 66],
    tail: { d: "M22 54q-14 3 -17 -6", pivot: [22, 54] },
    body: { cx: 62, cy: 50, rx: 44, ry: 15 },
    head: { cx: 107, cy: 47, r: 17 },
    ear: { cx: 99, cy: 46, tilt: -8 },
    mouth: "M112 55q4 2 8 0",
    muzzle: { cx: 116, cy: 52 },
  },
};

/** The size of each age's board: width, height. */
export const biscuitBoard = (age: Age) => shapes[age].board;

type BiscuitProps = {
  age: Age;
  /** His coat. Lantern everywhere but Still mode, which has no gold. */
  tone?: string;
};

/** Biscuit's parts, on his own board: for placing inside a larger scene. */
export function Biscuit({ age, tone = "fill-lantern" }: BiscuitProps) {
  const { tail, body, head, ear, mouth, muzzle } = shapes[age];
  return (
    <>
      <Part name="biscuit">
        <Part name="biscuit-tail" pivot={tail.pivot}>
          <path d={tail.d} className="fill-none" />
        </Part>
        <Part name="biscuit-body" pivot={[body.cx, body.cy + body.ry]}>
          <ellipse {...body} className={tone} />
        </Part>
        <Part name="biscuit-head">
          <circle {...head} className={tone} />
          {muzzle && (
            <Part name="biscuit-muzzle">
              <ellipse cx={muzzle.cx} cy={muzzle.cy} rx="9" ry="7.5" className="fill-linen stroke-none" />
            </Part>
          )}
          <Part name="biscuit-ear" pivot={[ear.cx + 2, ear.cy - 10]}>
            <ellipse
              cx={ear.cx}
              cy={ear.cy}
              rx="7"
              ry="12"
              transform={`rotate(${ear.tilt} ${ear.cx} ${ear.cy})`}
              className="fill-keepsake"
            />
          </Part>
          <path d={mouth} className="fill-none" />
        </Part>
      </Part>
    </>
  );
}

/** Biscuit at one age, as a picture of its own (section 6). */
export function BiscuitAt({ age }: { age: Age }) {
  const [width, height] = shapes[age].board;
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden
      focusable="false"
      className="block w-full overflow-visible stroke-ink stroke-2 [stroke-linecap:round] [stroke-linejoin:round]"
    >
      <Biscuit age={age} />
    </svg>
  );
}
