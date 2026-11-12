import { Artboard } from "./Artboard";
import { Part, Speck } from "./Part";

/** Where a cloud's puffs sit along it, and how big: [how far along, radius], both as a share of its width. */
type Puffs = readonly (readonly [along: number, radius: number])[];

const shapes = {
  tall: [[0.3, 0.19], [0.55, 0.25], [0.78, 0.15]],
  long: [[0.24, 0.13], [0.46, 0.2], [0.7, 0.23]],
  low: [[0.34, 0.2], [0.64, 0.16]],
  small: [[0.4, 0.21], [0.68, 0.15]],
} as const satisfies Record<string, Puffs>;

type CloudProps = {
  /** Left edge. */
  x: number;
  /** The flat underside. */
  base: number;
  width: number;
  puffs: Puffs;
};

/**
 * A soft, flat cloud: a pill for the underside with two or three round puffs
 * rising out of it, all one colour and no outline, so they read as one shape.
 */
function Cloud({ x, base, width, puffs }: CloudProps) {
  const body = width * 0.26;
  return (
    <Part name="cloud" className="hero-cloud">
      <rect x={x} y={base - body} width={width} height={body} rx={body / 2} />
      {puffs.map(([along, radius]) => (
        <circle key={along} cx={x + width * along} cy={base - width * radius * 1.08} r={width * radius} />
      ))}
    </Part>
  );
}

/**
 * PLACEHOLDER. Layer 1 of the zoom, furthest away: the street at dusk.
 * Sky, neighbours, a tree, pavement and road.
 * The family's own house is not here; it is the next layer (HouseArt).
 *
 * Moving parts: each `cloud` drifts across and wraps; each `speck` is a star
 * that comes and goes; the `tree` sways from its foot (the pivot), and each
 * `tree-leaf` clump turns a little about the middle of the canopy.
 *
 * Clouds: 6 to 12% of the scene's width, each at its own height so that no two
 * ever cross, and none in the strip the nav covers.
 */
export function StreetArt() {
  return (
    <Artboard
      landscape={
        <>
          <rect x="-10" y="-10" width="1620" height="920" className="fill-blush stroke-none" />

          <Speck x={120} y={64} />
          <Speck x={470} y={96} r={2} />
          <Speck x={548} y={214} />
          <Speck x={905} y={58} r={2} />
          <Speck x={1284} y={92} />
          <Speck x={1452} y={56} r={2} />
          <Speck x={1540} y={262} />
          <Speck x={64} y={250} r={2} />

          <Cloud x={470} base={131} width={104} puffs={shapes.low} />
          <Cloud x={1290} base={205} width={136} puffs={shapes.long} />
          <Cloud x={120} base={297} width={160} puffs={shapes.tall} />
          <Cloud x={660} base={347} width={96} puffs={shapes.small} />
          {/* dusk sky */}

          <rect x="150" y="400" width="410" height="300" className="fill-paper" />
          <polygon points="120,400 355,262 590,400" className="fill-keepsake" />
          <rect x="215" y="470" width="84" height="84" rx="6" className="fill-keepsake" />
          <rect x="410" y="470" width="84" height="84" rx="6" className="fill-keepsake" />
          {/* neighbour */}

          <Part name="tree" pivot={[690, 700]}>
            <Part name="tree-trunk">
              <rect x="680" y="560" width="20" height="140" className="fill-keepsake" />
            </Part>
            <Part name="tree-canopy">
              <circle cx="690" cy="500" r="86" className="fill-sage" />
            </Part>
            <Part name="tree-leaf" pivot={[690, 500]}>
              <circle cx="622" cy="452" r="30" className="fill-sage" />
            </Part>
            <Part name="tree-leaf" pivot={[690, 500]}>
              <circle cx="704" cy="418" r="28" className="fill-sage" />
            </Part>
            <Part name="tree-leaf" pivot={[690, 500]}>
              <circle cx="764" cy="476" r="30" className="fill-sage" />
            </Part>
            {/* tree */}
          </Part>

          <rect x="1400" y="380" width="320" height="320" className="fill-paper" />
          <polygon points="1370,380 1560,250 1750,380" className="fill-keepsake" />
          <rect x="1460" y="450" width="84" height="84" rx="6" className="fill-keepsake" />

          <rect x="-10" y="700" width="1620" height="56" className="fill-linen" />
          <rect x="-10" y="756" width="1620" height="160" className="fill-paper" />
          {/* street at dusk */}
        </>
      }
      portrait={
        <>
          <rect x="-400" y="-10" width="1700" height="2010" className="fill-blush stroke-none" />

          <Speck x={84} y={86} r={4} />
          <Speck x={392} y={72} r={3} />
          <Speck x={470} y={118} r={4} />
          <Speck x={704} y={226} r={3} />
          <Speck x={842} y={128} r={4} />
          <Speck x={62} y={338} r={3} />
          <Speck x={300} y={152} r={4} />
          <Speck x={826} y={336} r={3} />

          {/* A phone shows the middle 740 or so of this scene, so these are sized against that. */}
          <Cloud x={640} base={168} width={58} puffs={shapes.low} />
          <Cloud x={100} base={262} width={88} puffs={shapes.tall} />
          <Cloud x={734} base={318} width={72} puffs={shapes.small} />
          {/* dusk sky */}

          <rect x="-150" y="540" width="280" height="460" className="fill-paper" />
          <polygon points="-180,540 -10,410 160,540" className="fill-keepsake" />

          <rect x="790" y="500" width="280" height="500" className="fill-paper" />
          <polygon points="760,500 930,370 1100,500" className="fill-keepsake" />

          <Part name="tree" pivot={[847, 1000]}>
            <Part name="tree-trunk">
              <rect x="836" y="870" width="22" height="130" className="fill-keepsake" />
            </Part>
            <Part name="tree-canopy">
              <circle cx="847" cy="790" r="80" className="fill-sage" />
            </Part>
            <Part name="tree-leaf" pivot={[847, 790]}>
              <circle cx="786" cy="744" r="28" className="fill-sage" />
            </Part>
            <Part name="tree-leaf" pivot={[847, 790]}>
              <circle cx="852" cy="714" r="26" className="fill-sage" />
            </Part>
          </Part>

          <rect x="-400" y="1000" width="1700" height="76" className="fill-linen" />
          <rect x="-400" y="1076" width="1700" height="930" className="fill-paper" />
          <line x1="-410" y1="1340" x2="1310" y2="1340" strokeDasharray="70 60" />
          {/* street at dusk */}
        </>
      }
    />
  );
}
