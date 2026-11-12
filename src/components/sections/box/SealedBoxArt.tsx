import type { ReactNode } from "react";
import { Part } from "../hero/art/Part";
import { board, items, radii } from "./BoxSceneArt";

/**
 * PLACEHOLDER. The box with its lid on: sealed in section 5, waiting at the
 * start of the years in section 6, and opened once more in section 7. Rounded
 * blocks only; the commissioned art replaces it part for part.
 *
 * The same board as the open box (./BoxSceneArt.tsx): 400 × 280, the box at
 * x 190 to 350, y 152 to 244, the rings centred on its middle (270, 198).
 *
 * Moving parts, by name (see ../hero/art/Part.tsx). The story moves all of
 * them; none follows the clock:
 *   box         the whole box
 *   box-lid     the lid, hinged at the back left corner of the rim; holds the bow
 *   bow         the tied ribbon on the lid: holds bow-knot and two bow-loop.
 *               Each grows out of the knot as the ribbon ties itself.
 *   box-item    the top of one thing in the box, seen until the lid is down
 *   ring-next   the ring that starts to grow once the box is sealed
 *   letter      section 7 only: Mary's letter, which rises out of the open box
 */
const { centre, box } = board;
const lid = { left: box.left - 6, top: box.top - 28, width: box.width + 12, height: 28 } as const;
/** Where the ribbon is tied: on the middle of the lid. */
const knot = [centre.x, lid.top - 3] as const;
/** The ring after the four the box already has. */
const nextRadius = 200;

type BoardProps = {
  /**
   * The line every shape is drawn with. Ink on linen; on a block of colour,
   * the block's own colour, so the shapes read as cut out of it.
   */
  line?: string;
  children: ReactNode;
};

export function SealedBoard({ line = "stroke-ink", children }: BoardProps) {
  return (
    <svg
      viewBox={`0 0 ${board.width} ${board.height}`}
      aria-hidden
      focusable="false"
      className={`absolute inset-0 size-full overflow-visible stroke-2 [stroke-linecap:round] [stroke-linejoin:round] ${line}`}
    >
      {children}
    </svg>
  );
}

type RingsProps = {
  /** One class for every ring, or leave it out for the hero's heartwood and lantern, turn about. */
  tone?: string;
};

/** The four rings the box has grown so far, and the next one, which waits unseen. */
export function SealedRings({ tone }: RingsProps) {
  const ring = "fill-none [stroke-width:1.75px] [vector-effect:non-scaling-stroke]";
  return (
    <>
      {radii.map((r, i) => (
        <circle
          key={r}
          cx={centre.x}
          cy={centre.y}
          r={r}
          className={`${ring} ${tone ?? (i % 2 === 0 ? "stroke-heartwood" : "stroke-lantern")}`}
        />
      ))}
      <circle
        data-part="ring-next"
        cx={centre.x}
        cy={centre.y}
        r={nextRadius}
        style={{ transformOrigin: `${centre.x}px ${centre.y}px` }}
        className={`sealed-ring-next ${ring} ${tone ?? "stroke-heartwood"}`}
      />
    </>
  );
}

type BoxProps = {
  /** Show what is inside, above the rim: seen while the lid is still coming down. */
  contents?: boolean;
  /** The ribbon's colour. Still mode has no gold: there it is keepsake. */
  ribbon?: string;
  /** The ribbon is tied. Left off once it has been untied (section 7). */
  bow?: boolean;
  /** Drawn between the inside of the box and its front: what rises out of it (section 7). */
  children?: ReactNode;
};

export function SealedBox({ contents = false, ribbon = "fill-lantern", bow = true, children }: BoxProps) {
  return (
    <Part name="box" pivot={[centre.x, box.top + box.height]}>
      {contents &&
        items.map(({ x, top, tilt, tone }) => (
          <rect
            key={x}
            data-part="box-item"
            x={x - 17}
            y={top}
            width="34"
            height="44"
            rx="5"
            transform={`rotate(${tilt} ${x} ${box.top})`}
            className={tone}
          />
        ))}
      {children}
      <rect x={box.left} y={box.top} width={box.width} height={box.height} rx="12" className="fill-paper" />
      <rect x={centre.x - 8} y={box.top} width="16" height={box.height} className={ribbon} />
      <Part name="box-lid" pivot={[box.left - 2, box.top]}>
        <rect x={lid.left} y={lid.top} width={lid.width} height={lid.height} rx="10" className="fill-paper" />
        <rect x={centre.x - 8} y={lid.top} width="16" height={lid.height} className={ribbon} />
        {bow && (
          <>
            <Part name="bow">
              <Part name="bow-loop" pivot={knot}>
                <ellipse
                  cx={knot[0] - 19}
                  cy={knot[1] - 6}
                  rx="20"
                  ry="11"
                  transform={`rotate(-18 ${knot[0] - 19} ${knot[1] - 6})`}
                  className={ribbon}
                />
              </Part>
              <Part name="bow-loop" pivot={knot}>
                <ellipse
                  cx={knot[0] + 19}
                  cy={knot[1] - 6}
                  rx="20"
                  ry="11"
                  transform={`rotate(18 ${knot[0] + 19} ${knot[1] - 6})`}
                  className={ribbon}
                />
              </Part>
              <Part name="bow-knot" pivot={knot}>
                <circle cx={knot[0]} cy={knot[1]} r="8" className={ribbon} />
              </Part>
            </Part>
          </>
        )}
      </Part>
    </Part>
  );
}
