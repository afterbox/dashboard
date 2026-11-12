import type { ReactNode } from "react";

type Props = {
  /**
   * What this part is. The ambient motion finds parts by name (see
   * ../ambient/behaviours.ts), so the name is the contract with the final art:
   * give the commissioned group the same name and it moves the same way.
   */
  name: string;
  /**
   * The point the part turns or grows about, in artboard units: the foot of
   * the tree, the base of a tail, the neck. Parts that only slide or fade
   * need none.
   */
  pivot?: readonly [x: number, y: number];
  /** Which person this belongs to (a head, a hand). */
  who?: string;
  /** Where the bird can land, as offsets from where it is drawn: "x,y x,y". */
  perches?: string;
  className?: string;
  children: ReactNode;
};

/**
 * A piece of a layer that moves on its own: a cloud, the bird's head, Biscuit's
 * tail. A plain SVG group, in the same artboard coordinates as everything else.
 *
 * Names in use:
 *   street  cloud · speck · tree (tree-trunk, tree-canopy, tree-leaf)
 *   house   bird (bird-body, bird-head)
 *   window  window-light
 *   table   lamp-light · speck · person (person-head, person-eyes) · person-hand
 *           biscuit (biscuit-body, biscuit-head, biscuit-ear, biscuit-tail)
 *           ball (not ambient: it falls once, see ../ball.ts)
 *
 * Section 2 draws the same kitchen at night (../../kitchen-table/KitchenNightArt.tsx)
 * and uses lamp-light, person (person-head) and biscuit (biscuit-body,
 * biscuit-head) from the table, plus three of its own. person-body breathes;
 * paper and box follow the scroll rather than the clock:
 *   person-body · paper · box (box-papers)
 *
 * Sections 3 and 4 share the open box (../../box/BoxSceneArt.tsx), and section 4
 * draws Mary growing up (../../say-it/art/MaryArt.tsx). The story moves most of
 * these; the clock only biscuit, person and wave:
 *   box (box-lid, box-item) · envelope
 *   biscuit (biscuit-tail, biscuit-up (biscuit-body, biscuit-head (biscuit-perk (biscuit-ear))))
 *   mary-4 · mary-10 · mary-15 (each a person) · mary-mark
 *   wave (wave-bar)
 *
 * Sections 5 to 7 use the box with its lid on (../../box/SealedBoxArt.tsx),
 * Biscuit at three ages (../../grows/BiscuitAges.tsx) and the hall on the day
 * the box opens (../../opening/OpeningArt.tsx). The story moves the box; the
 * clock only Biscuit, and not at all in section 7 (Still mode):
 *   box (box-item, box-lid (bow (bow-loop, bow-knot))) · ring-next · letter
 *   biscuit (biscuit-tail, biscuit-body, biscuit-head (biscuit-muzzle, biscuit-ear))
 *
 * Section 10 is the hero's layers again, at night (`night` on StreetArt,
 * HouseArt and TableArt). It adds nothing new by name: the porch lamp is a
 * window-light, and the dog on the doorstep is the old biscuit above.
 *
 * docs/illustrator-brief.md lists every name with its pivot. Keep it in step.
 */
export function Part({ name, pivot, who, perches, className, children }: Props) {
  return (
    <g
      data-part={name}
      data-who={who}
      data-perches={perches}
      className={className}
      style={pivot && { transformOrigin: `${pivot[0]}px ${pivot[1]}px` }}
    >
      {children}
    </g>
  );
}

type BallProps = {
  /** Its centre, resting on the table. */
  x: number;
  y: number;
  r: number;
  /** How far it rolls to the table's edge. Negative is leftwards. */
  roll: number;
  /** From the table top to the floor. */
  drop: number;
  /** From the edge to where it comes to rest. Same sign as `roll`. */
  travel: number;
};

/**
 * The ball that rolls off the table, once (see ../ball.ts). It turns about its
 * own centre, and the seam across it is what shows the turning.
 */
export function Ball({ x, y, r, roll, drop, travel }: BallProps) {
  return (
    <g
      data-part="ball"
      data-roll={roll}
      data-drop={drop}
      data-travel={travel}
      data-radius={r}
      style={{ transformOrigin: `${x}px ${y}px` }}
    >
      <circle cx={x} cy={y} r={r} className="fill-heartwood" />
      <path
        d={`M${x - r * 0.8} ${y - r * 0.2}Q${x} ${y - r * 0.9} ${x + r * 0.8} ${y - r * 0.2}`}
        className="fill-none"
      />
    </g>
  );
}

/** A first star, or a mote of dust in lamplight. Unseen until the ambient motion fades it in. */
export function Speck({ x, y, r = 3 }: { x: number; y: number; r?: number }) {
  return (
    <Part name="speck" className="opacity-0">
      <circle cx={x} cy={y} r={r} className="fill-lantern stroke-none" />
    </Part>
  );
}
