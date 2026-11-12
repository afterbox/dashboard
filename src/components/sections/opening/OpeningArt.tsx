import { SealedBox } from "../box/SealedBoxArt";
import { Biscuit, biscuitBoard } from "../grows/BiscuitAges";
import { Part } from "../hero/art/Part";
import { Person } from "../hero/art/TableArt";

/**
 * PLACEHOLDER. The day the box opens (section 7): the hall of the same house,
 * years on. Mary, about 25, stands by the table the box is on. The door frame
 * behind her still has her height marked on it in pencil (section 4), and
 * Biscuit, old now, lies by the door. Blocks only; the commissioned art
 * replaces it part for part.
 *
 * Still mode: no gold. Mary and the box's ribbon are keepsake, Biscuit's coat
 * is the page's own line colour, and nobody breathes, blinks or twitches.
 *
 * Drawn twice, on the box's own board (../box/SealedBoxArt.tsx: the box
 * stands at x 190 to 350, y 152 to 244), with the floor at y 300:
 *   landscape   x −150 to 390, y −130 to 330: door, Biscuit, Mary, box, left to right
 *   portrait    x 70 to 390, y −120 to 380: Mary and the box above, Biscuit
 *               lying in front of them on the floor
 * The wall is the panel the art sits in, and the floor runs on past every
 * edge, so either fits a panel of any shape, standing on its bottom edge.
 *
 * Moving parts, by name (./opening.css moves them, once):
 *   box-lid   lifts, slowly, on its hinge at the back left of the rim
 *   letter    Mary's letter: rises out of the open box
 * `biscuit` and `person` keep their names and parts, but nothing moves them here.
 */
const floor = 300;
const boards = {
  landscape: { view: "-150 -130 540 460", door: -130, mary: 110, biscuit: [-74, 236] },
  portrait: { view: "70 -120 320 500", door: 84, mary: 124, biscuit: [86, 318] },
} as const;

const [dogWidth, dogHeight] = biscuitBoard("old");

export function OpeningArt({ shape }: { shape: keyof typeof boards }) {
  const { view, door, mary, biscuit } = boards[shape];
  return (
    <svg
      viewBox={view}
      preserveAspectRatio="xMidYMax meet"
      aria-hidden
      focusable="false"
      className={`opening-${shape} absolute inset-0 size-full overflow-visible stroke-ink stroke-2 [stroke-linecap:round] [stroke-linejoin:round]`}
    >
      {/* floor */}
      <rect x="-2000" y={floor} width="4400" height="1200" className="fill-linen" />

      {/* the door, its knob, and Mary's three heights in pencil on the frame */}
      <rect x={door} y="-84" width="104" height={floor + 84} rx="4" className="fill-linen" />
      <circle cx={door + 86} cy="128" r="5" className="fill-paper" />
      {[86, 118, 148].map((height) => (
        <path key={height} d={`M${door + 104} ${floor - height}h14`} className="fill-none" />
      ))}

      {/* the table the box stands on */}
      <rect x="180" y="254" width="9" height={floor - 254} className="fill-linen" />
      <rect x="351" y="254" width="9" height={floor - 254} className="fill-linen" />
      <rect x="164" y="244" width="212" height="11" rx="5" className="fill-linen" />

      {/* Biscuit, old, resting by the door. Still. */}
      <svg x={biscuit[0]} y={biscuit[1]} width={dogWidth} height={dogHeight} viewBox={`0 0 ${dogWidth} ${dogHeight}`} className="overflow-visible">
        <Biscuit age="old" tone="fill-line" />
      </svg>

      {/* Mary, about 25 */}
      <Person who="mary" x={mary} y={floor - 132 - 27 + 6} r={27} width={76} height={132} tone="fill-keepsake" calm />

      {/* The box: its ribbon untied. The letter is inside until the lid lifts. */}
      <SealedBox ribbon="fill-keepsake" bow={false}>
        <Part name="letter">
          <g transform="rotate(6 304 114)">
            <rect x="273" y="93" width="62" height="42" rx="5" className="fill-paper" />
            <path d="M276 96L304 117L332 96" className="fill-none" />
          </g>
        </Part>
      </SealedBox>
    </svg>
  );
}
