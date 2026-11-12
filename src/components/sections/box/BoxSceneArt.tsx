import type { CSSProperties, ReactNode } from "react";
import { Part } from "../hero/art/Part";

/**
 * PLACEHOLDER. The open box with Biscuit beside it: the scene sections 3 and
 * 4 share. Rounded blocks only; the commissioned art replaces it part for part.
 *
 * One board, 400 × 280. The box stands at x 190 to 350, y 152 to 244, and the
 * rings are centred on its middle (270, 198). Everything is drawn in three
 * layers, so that what drops into the box can pass between them:
 *
 *   BoxRings   the growth rings, one per thing added
 *   BoxBack    Biscuit, whatever is showing above the rim, and the lifted lid over it
 *   BoxFront   the front of the box, drawn last
 *
 * Moving parts, by name (see ../hero/art/Part.tsx; box-scene.css moves the
 * ones that follow the story rather than the clock):
 *   biscuit       holds biscuit-tail, and biscuit-up: all of him that lifts
 *                 when he sits up (biscuit-body, biscuit-head). It turns about
 *                 his hips.
 *   biscuit-perk  holds biscuit-ear: lifts when a card appears
 *   box           each piece of the box (what's in it, its lid, its front): all squash
 *                 together on each catch, from its foot
 *   box-lid       the lid, hinged at the back left corner of the rim
 *   box-item      the top of one thing in the box; one more shows per catch
 *   envelope      section 4 only: one letter each, waiting beside the box
 */
export const board = {
  width: 400,
  height: 280,
  /** The middle of the box, and of the rings. */
  centre: { x: 270, y: 198 },
  box: { left: 190, top: 152, width: 160, height: 92 },
} as const;

const { centre, box } = board;
const foot = [centre.x, box.top + box.height] as const;

type BoardProps = {
  /**
   * Say where the mouth of the box is ("x,top,width"), for whatever is scripted
   * to fly into it (section 4's letters; see ../say-it/into-the-box.ts).
   */
  mouth?: boolean;
  children: ReactNode;
};

function Board({ mouth = false, children }: BoardProps) {
  return (
    <svg
      viewBox={`0 0 ${board.width} ${board.height}`}
      data-mouth={mouth ? `${centre.x},${box.top},${box.width}` : undefined}
      aria-hidden
      focusable="false"
      className="absolute inset-0 size-full overflow-visible stroke-ink stroke-2 [stroke-linecap:round] [stroke-linejoin:round]"
    >
      {children}
    </svg>
  );
}

/** Which one this is, counted from 1. box-scene.css shows it once that many have been added. */
const nth = (k: number) => ({ "--k": k }) as CSSProperties;

/** From the oldest ring outward. */
const radii = [104, 128, 152, 176] as const;

/** The growth rings around the box. The line is held at 1.75px on screen, as in the hero. */
export function BoxRings() {
  return (
    <Board>
      {radii.map((r, i) => (
        <circle
          key={r}
          cx={centre.x}
          cy={centre.y}
          r={r}
          style={nth(i + 1)}
          className={`box-ring fill-none [stroke-width:1.75px] [vector-effect:non-scaling-stroke] ${
            i % 2 === 0 ? "stroke-heartwood" : "stroke-lantern"
          }`}
        />
      ))}
    </Board>
  );
}

/**
 * Biscuit, lying beside the box with his head towards it. The same blocks as
 * in the hero, awake. He breathes, and his ear and tail twitch now and then
 * (../hero/ambient/behaviours.ts); the story lifts his ear, wags his tail and
 * sits him up (box-scene.css, and ../fill-it/drop.ts for the wag).
 */
function Biscuit() {
  return (
    <Part name="biscuit">
      <Part name="biscuit-tail" pivot={[40, 228]}>
        <path d="M40 228q-18 -6 -15 -24" className="fill-none" />
      </Part>
      <Part name="biscuit-up" pivot={[62, 240]}>
        <Part name="biscuit-body" pivot={[96, 243]}>
          <ellipse cx="96" cy="220" rx="62" ry="23" className="fill-lantern" />
        </Part>
        <Part name="biscuit-head">
          <circle cx="152" cy="214" r="21" className="fill-lantern" />
          <Part name="biscuit-perk" pivot={[146, 198]}>
            <Part name="biscuit-ear" pivot={[146, 198]}>
              <ellipse cx="143" cy="208" rx="8" ry="13" transform="rotate(-25 143 208)" className="fill-keepsake" />
            </Part>
          </Part>
          <path d="M157 219q5 4 10 0" className="fill-none" />
        </Part>
      </Part>
    </Part>
  );
}

/** The tops of the things in the box, in the order they land: from the open side, away from the hinge. */
const items = [
  { x: 304, top: 134, tilt: 5, tone: "fill-paper" },
  { x: 246, top: 132, tilt: -4, tone: "fill-blush" },
  { x: 327, top: 138, tilt: 8, tone: "fill-paper" },
  { x: 276, top: 130, tilt: 2, tone: "fill-paper" },
  { x: 220, top: 137, tilt: -7, tone: "fill-blush" },
] as const;

type EnvelopeProps = {
  /** Its centre, where it waits. */
  x: number;
  y: number;
  /** How it lies, in degrees. */
  tilt: number;
};

/**
 * One of Dad's letters, waiting beside the box (section 4). Each slides into
 * the box on the way to section 5 (see ../say-it/into-the-box.ts), so each is
 * a group of its own and says where it lies. Reduced motion: already in the
 * box, so not shown.
 */
function Envelope({ x, y, tilt }: EnvelopeProps) {
  const w = 62;
  const h = 42;
  return (
    <g
      data-part="envelope"
      data-at={`${x},${y}`}
      data-tilt={tilt}
      className="motion-reduce:opacity-0!"
      style={{ transformOrigin: `${x}px ${y}px` }}
    >
      <g transform={`rotate(${tilt} ${x} ${y})`}>
        <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx="5" className="fill-paper" />
        <path d={`M${x - w / 2 + 3} ${y - h / 2 + 3}L${x} ${y + 3}L${x + w / 2 - 3} ${y - h / 2 + 3}`} className="fill-none" />
      </g>
    </g>
  );
}

type BackProps = {
  /** Section 4: Dad's three letters wait where Biscuit lay, and he isn't drawn. */
  letters?: boolean;
};

/** Everything behind what drops in: Biscuit, the things already in the box, the lifted lid. */
export function BoxBack({ letters = false }: BackProps) {
  return (
    <Board mouth={letters}>
      {!letters && <Biscuit />}
      <Part name="box" pivot={foot}>
        {items.map(({ x, top, tilt, tone }, i) => (
          <rect
            key={x}
            data-part="box-item"
            x={x - 17}
            y={top}
            width="34"
            height="44"
            rx="5"
            transform={`rotate(${tilt} ${x} ${box.top})`}
            style={nth(i + 1)}
            className={`box-item ${tone}`}
          />
        ))}
      </Part>
      {letters && (
        <>
          <Envelope x={58} y={214} tilt={-14} />
          <Envelope x={98} y={222} tilt={6} />
          <Envelope x={138} y={216} tilt={-5} />
        </>
      )}
      {/*
        The lid, in front of what is in the box and of the letters: they slide in under it, and it comes
        down over them. Open until section 4 begins to close it (reduced motion: already part-closed there).
        Its ribbon is untied: no bow until section 5.
      */}
      <Part name="box" pivot={foot}>
        <Part
          name="box-lid"
          pivot={[box.left - 2, box.top]}
          className={letters ? "-rotate-32 motion-reduce:-rotate-14" : "-rotate-32"}
        >
          <rect x={box.left - 6} y={box.top - 28} width={box.width + 12} height="28" rx="10" className="fill-paper" />
          <rect x={centre.x - 8} y={box.top - 28} width="16" height="28" className="fill-lantern" />
        </Part>
      </Part>
    </Board>
  );
}

/** The front of the box, with its ribbon. Drawn last, so things drop in behind it. */
export function BoxFront() {
  return (
    <Board>
      <Part name="box" pivot={foot}>
        <rect x={box.left} y={box.top} width={box.width} height={box.height} rx="12" className="fill-paper" />
        <rect x={centre.x - 8} y={box.top} width="16" height={box.height} className="fill-lantern" />
      </Part>
    </Board>
  );
}
