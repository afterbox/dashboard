import type { ReactNode } from "react";
import { Part } from "../hero/art/Part";

/**
 * One drawing of the night kitchen, on one of the hero's two boards
 * (landscape 1600 × 900, portrait 900 × 1600; see ../hero/art/Artboard.tsx).
 * The room is where the hero left it, so the commissioned scene can be drawn
 * on the same boards and swapped in file for file.
 *
 * The panel never shows a whole board. `safe` is the part of it that always
 * fits inside the panel, whatever its shape: the table and everything on,
 * at and under it. The rest of the room carries on past it and is cropped.
 */
function Board({ shape, safe, children }: { shape: "landscape" | "portrait"; safe: string; children: ReactNode }) {
  return (
    <svg
      viewBox={safe}
      data-board={shape}
      aria-hidden
      focusable="false"
      className="night-board absolute inset-0 size-full overflow-visible"
    >
      {children}
    </svg>
  );
}

type SitterProps = {
  who: string;
  x: number;
  /** Centre of the head. */
  y: number;
  /** Head radius. */
  r: number;
  width: number;
  height: number;
};

/**
 * A stand-in for Mary's mum: the same block and circle as in the hero, a
 * little lower over the laptop, eyes down. No more than that. She only
 * breathes: her chest (`person-body`) rises from where she sits, and her head
 * (`person-head`) rides up on her shoulders.
 */
function Sitter({ who, x, y, r, width, height }: SitterProps) {
  const shoulders = y + r - 6;
  const eye = (cx: number) => `M${cx - 5} ${y + 5}q5 4 10 0`;
  return (
    <Part name="person" who={who}>
      <Part name="person-body" pivot={[x, shoulders + height]}>
        <rect x={x - width / 2} y={shoulders} width={width} height={height} rx={width / 2.4} className="night-soft" />
      </Part>
      <Part name="person-head">
        <circle cx={x} cy={y} r={r} className="night-pale" />
        <path d={`${eye(x - r / 3)}${eye(x + r / 3)}`} className="night-mark" />
      </Part>
    </Part>
  );
}

type SheetProps = {
  /** Its centre. */
  x: number;
  y: number;
  /** How it lies, in degrees. */
  tilt: number;
  /** Portrait art is drawn a little larger. */
  size?: number;
};

/**
 * One of the scattered papers (`paper`). On the turn each one lifts, straightens
 * and flies into the box (see ./hand-off.ts), so each is a group of its own
 * and says where it lies. Reduced motion: already in the box, so not shown.
 */
function Sheet({ x, y, tilt, size = 1 }: SheetProps) {
  const w = 46 * size;
  const h = 58 * size;
  return (
    <g
      data-part="paper"
      data-at={`${x},${y}`}
      data-tilt={tilt}
      className="motion-reduce:opacity-0!"
      style={{ transformOrigin: `${x}px ${y}px` }}
    >
      <g transform={`rotate(${tilt} ${x} ${y})`}>
        <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={4 * size} className="night-sheet" />
        <path
          d={`M${x - w * 0.27} ${y - h * 0.2}h${w * 0.54}M${x - w * 0.27} ${y}h${w * 0.36}`}
          className="night-rule"
        />
      </g>
    </g>
  );
}

type BoxProps = {
  /** The middle of the box. */
  x: number;
  /** The table top it stands on. */
  y: number;
  size?: number;
};

/**
 * The box from the hero, open, at Dad's place at the table. No ribbon here:
 * this section has no gold. It isn't in the room until the turn, when it fades
 * in (`box`) and the papers fly into it; `box-papers` are their top edges,
 * showing once they have landed. Reduced motion: there from the start, full.
 *
 * It says where its mouth is (the middle of the rim) and how wide it is, so
 * the papers know where to go.
 */
function KeepsakeBox({ x, y, size = 1 }: BoxProps) {
  const w = 118 * size;
  const h = 67 * size;
  const left = x - w / 2;
  const top = y - h;
  const peek = { w: 42 * size, h: 34 * size };
  return (
    <g data-part="box" data-mouth={`${x},${top},${w}`} className="opacity-0 motion-reduce:opacity-100!">
      {/* the lid, lifted */}
      <rect
        x={left - 5 * size}
        y={top - 27 * size}
        width={w + 10 * size}
        height={25 * size}
        rx={8 * size}
        transform={`rotate(-24 ${left - 2 * size} ${top})`}
        className="night-box"
      />
      <g data-part="box-papers" className="opacity-0 motion-reduce:opacity-100!">
        <rect
          x={x - peek.w - 2 * size}
          y={top - 14 * size}
          width={peek.w}
          height={peek.h}
          rx={4 * size}
          transform={`rotate(-5 ${x - peek.w / 2} ${top})`}
          className="night-sheet"
        />
        <rect
          x={x + 2 * size}
          y={top - 18 * size}
          width={peek.w}
          height={peek.h}
          rx={4 * size}
          transform={`rotate(4 ${x + peek.w / 2} ${top})`}
          className="night-sheet"
        />
      </g>
      <rect x={left} y={top} width={w} height={h} rx={7 * size} className="night-box" />
    </g>
  );
}

/**
 * PLACEHOLDER. The same kitchen as the hero, later, at night. Mary's mum sits
 * at the table with a laptop and a notepad. Dad's chair is empty. Papers are
 * scattered on the table and the floor. One lamp is on. Biscuit lies still
 * underneath. Quiet, not tragic: nobody is in distress, and nothing is dark
 * for effect.
 *
 * Rounded blocks only, in steps between the night wall and the lamplight (see
 * kitchen-table.css). The wall is the panel's own colour, so it carries on
 * past every edge.
 *
 * Moving parts, by name, as in the hero (../hero/art/Part.tsx):
 *   lamp-light    the pendant and its light: flickers very softly
 *   person        Mary's mum; holds person-body and person-head: she breathes
 *   biscuit       holds biscuit-body and biscuit-head: he breathes, nothing else
 *   paper         one sheet each: flies into the box on the turn
 *   box           fades in on the turn; holds box-papers
 */
export function KitchenNightArt() {
  return (
    <>
      <Board shape="landscape" safe="798 150 580 580">
        <rect x="-2400" y="700" width="6400" height="2400" className="night-floor" />

        <rect x="300" y="270" width="150" height="116" rx="8" className="night-shade" />
        <rect x="190" y="540" width="360" height="160" rx="14" className="night-shade" />
        <circle cx="480" cy="508" r="32" className="night-table" />
        {/* the lamp by the wall, off */}
        <rect x="1462" y="290" width="118" height="410" rx="8" className="night-shade" />
        {/* sideboard */}

        <line x1="1088" y1="-2400" x2="1088" y2="170" strokeWidth="2" className="night-line" />
        <Part name="lamp-light">
          <polygon points="1046,222 1130,222 1262,440 914,440" className="night-beam" />
          <polygon points="1046,222 1130,222 1108,170 1068,170" className="night-light" />
        </Part>
        {/* the one lamp on */}

        <rect x="989" y="322" width="72" height="132" rx="14" strokeWidth="12" className="night-line" />
        {/* Dad's chair, empty */}
        <Sitter who="partner" x={1270} y={302} r={34} width={96} height={130} />
        {/* Mary's mum */}

        <rect x="852" y="466" width="18" height="234" className="night-table" />
        <rect x="1306" y="466" width="18" height="234" className="night-table" />
        <rect x="828" y="440" width="520" height="26" rx="8" className="night-table" />
        {/* kitchen table */}

        <rect x="1224" y="374" width="92" height="64" rx="6" className="night-pale" />
        <rect x="1210" y="434" width="120" height="8" rx="4" className="night-pale" />
        {/* laptop */}
        <rect x="1152" y="425" width="52" height="15" rx="3" className="night-pale" />
        <path d="M1162 420l30 -8" strokeWidth="4" className="night-line" />
        {/* notepad and pen */}

        <Part name="biscuit">
          <path d="M1004 660q-24 -6 -21 -28" strokeWidth="9" className="night-line" />
          <Part name="biscuit-body" pivot={[1080, 698]}>
            <ellipse cx="1080" cy="668" rx="80" ry="30" className="night-soft" />
          </Part>
          <Part name="biscuit-head">
            <circle cx="1156" cy="672" r="26" className="night-soft" />
            <ellipse cx="1146" cy="654" rx="10" ry="17" transform="rotate(-25 1146 654)" className="night-table" />
            <path d="M1162 677q6 5 12 0" className="night-mark" />
          </Part>
        </Part>
        {/* Biscuit, lying still */}

        <Sheet x={922} y={676} tilt={-74} />
        <Sheet x={1240} y={677} tilt={78} />
        <Sheet x={856} y={414} tilt={-16} />
        <Sheet x={880} y={405} tilt={5} />
        <Sheet x={903} y={419} tilt={11} />
        <Sheet x={936} y={411} tilt={-6} />
        <Sheet x={1122} y={416} tilt={9} />
        {/* scattered papers */}

        <KeepsakeBox x={1025} y={440} />
        {/* the box, at Dad's place */}
      </Board>

      <Board shape="portrait" safe="140 120 620 925">
        <rect x="-2400" y="960" width="5700" height="2400" className="night-floor" />
        <ellipse cx="450" cy="1000" rx="340" ry="64" className="night-shade" />

        <rect x="600" y="150" width="180" height="130" rx="8" className="night-shade" />

        <line x1="450" y1="-2400" x2="450" y2="252" strokeWidth="2" className="night-line" />
        <Part name="lamp-light">
          <polygon points="402,312 498,312 650,566 250,566" className="night-beam" />
          <polygon points="402,312 498,312 474,252 426,252" className="night-light" />
        </Part>
        {/* the one lamp on */}

        <rect x="341" y="432" width="84" height="148" rx="16" strokeWidth="13" className="night-line" />
        {/* Dad's chair, empty */}
        <Sitter who="partner" x={650} y={409} r={38} width={104} height={150} />
        {/* Mary's mum */}

        <rect x="196" y="594" width="20" height="396" className="night-table" />
        <rect x="684" y="594" width="20" height="396" className="night-table" />
        <rect x="170" y="566" width="560" height="28" rx="8" className="night-table" />
        {/* kitchen table */}

        <rect x="598" y="490" width="104" height="72" rx="7" className="night-pale" />
        <rect x="582" y="558" width="136" height="9" rx="4.5" className="night-pale" />
        {/* laptop */}
        <rect x="520" y="549" width="48" height="17" rx="3" className="night-pale" />
        <path d="M530 544l32 -9" strokeWidth="4.5" className="night-line" />
        {/* notepad and pen */}

        <Part name="biscuit">
          <path d="M349 958q-28 -8 -24 -34" strokeWidth="10" className="night-line" />
          <Part name="biscuit-body" pivot={[440, 1004]}>
            <ellipse cx="440" cy="968" rx="95" ry="36" className="night-soft" />
          </Part>
          <Part name="biscuit-head">
            <circle cx="530" cy="972" r="31" className="night-soft" />
            <ellipse cx="518" cy="950" rx="12" ry="20" transform="rotate(-25 518 950)" className="night-table" />
            <path d="M537 978q7 6 14 0" className="night-mark" />
          </Part>
        </Part>
        {/* Biscuit, lying still */}

        <Sheet x={272} y={932} tilt={-74} size={1.15} />
        <Sheet x={622} y={934} tilt={78} size={1.15} />
        <Sheet x={198} y={536} tilt={-16} size={1.15} />
        <Sheet x={224} y={526} tilt={5} size={1.15} />
        <Sheet x={250} y={542} tilt={11} size={1.15} />
        <Sheet x={286} y={533} tilt={-6} size={1.15} />
        <Sheet x={486} y={538} tilt={9} size={1.15} />
        {/* scattered papers */}

        <KeepsakeBox x={383} y={566} size={1.15} />
        {/* the box, at Dad's place */}
      </Board>
    </>
  );
}
