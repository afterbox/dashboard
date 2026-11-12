import { Artboard } from "./Artboard";
import { Ball, Part, Speck } from "./Part";

type PersonProps = {
  /** Who this is. Their hand, drawn later so it sits in front of the table, carries the same name. */
  who: string;
  x: number;
  /** Centre of the head. */
  y: number;
  /** Head radius. */
  r: number;
  width: number;
  height: number;
  /** Fill class for the body. */
  tone: string;
};

/**
 * A stand-in for one of the cast: a block for the body, a circle for the head,
 * dot eyes, a small smile. Deliberately no more than that; the real cast is
 * being drawn (and has a range of skin tones).
 *
 * Moving parts: the whole `person` breathes from where they sit; the
 * `person-head` tilts about the neck; the `person-eyes` blink.
 */
function Person({ who, x, y, r, width, height, tone }: PersonProps) {
  const shoulders = y + r - 6;
  return (
    <Part name="person" who={who} pivot={[x, shoulders + height]}>
      <rect x={x - width / 2} y={shoulders} width={width} height={height} rx={width / 2.4} className={tone} />
      <Part name="person-head" pivot={[x, y + r]}>
        <circle cx={x} cy={y} r={r} className="fill-blush" />
        <Part name="person-eyes" pivot={[x, y - 2]}>
          <circle cx={x - r / 3} cy={y - 2} r="3" className="fill-ink stroke-none" />
          <circle cx={x + r / 3} cy={y - 2} r="3" className="fill-ink stroke-none" />
        </Part>
        <path
          d={`M${x - r / 4} ${y + r / 3}Q${x} ${y + r / 1.7} ${x + r / 4} ${y + r / 3}`}
          className="fill-none"
        />
      </Part>
    </Part>
  );
}

type HandProps = {
  /** Whose hand. */
  who: string;
  /** Centre of the cup. */
  x: number;
  /** The table top the cup stands on. */
  y: number;
  /** Portrait art is drawn a little larger. */
  size?: number;
};

/** A hand resting by a cup on the table. Now and then it lifts the cup (`person-hand`). */
function Hand({ who, x, y, size = 1 }: HandProps) {
  const cup = { width: 16 * size, height: 22 * size };
  const palm = 8 * size;
  return (
    <Part name="person-hand" who={who} pivot={[x - cup.width, y - palm]}>
      <rect x={x - cup.width / 2} y={y - cup.height} width={cup.width} height={cup.height} rx="3" className="fill-paper" />
      <circle cx={x - cup.width} cy={y - palm - 2} r={palm} className="fill-blush" />
    </Part>
  );
}

/**
 * PLACEHOLDER. Layer 2 of the zoom: the family at the kitchen table, with
 * Biscuit asleep underneath. First seen small, through the window.
 * The table top sits on the shared centre point. The wall colour carries on
 * past the edges of the artboard (the `bleed` on this plane in HeroScene).
 *
 * Moving parts: the people (see Person and Hand above); each `lamp-light`
 * flickers very softly; each `speck` is dust in the lamplight; Biscuit
 * breathes (`biscuit-body` from the floor, `biscuit-head` with it), and his
 * `biscuit-ear` and `biscuit-tail` twitch about their pivots. The `ball` on
 * the table's edge falls to the floor, once (see ../ball.ts).
 */
export function TableArt() {
  return (
    <Artboard
      landscape={
        <>
          <rect x="-10" y="-10" width="1620" height="920" className="fill-paper stroke-none" />
          <rect x="-10" y="700" width="1620" height="210" className="fill-blush" />

          <rect x="300" y="270" width="150" height="116" rx="8" className="fill-blush" />
          <rect x="190" y="540" width="360" height="160" rx="14" className="fill-linen" />
          <Part name="lamp-light">
            <circle cx="480" cy="508" r="32" className="fill-lantern" />
          </Part>
          {/* sideboard */}
          <rect x="1462" y="290" width="118" height="410" rx="8" className="fill-linen" />
          {/* door */}

          <line x1="1088" y1="-10" x2="1088" y2="170" />
          <Part name="lamp-light">
            <polygon points="1046,222 1130,222 1108,170 1068,170" className="fill-lantern" />
          </Part>
          <Speck x={1012} y={196} r={2} />
          <Speck x={1168} y={186} r={2} />
          <Speck x={970} y={142} r={2} />
          <Speck x={1206} y={150} r={2} />

          <Person who="mum" x={905} y={296} r={34} width={96} height={130} tone="fill-keepsake" />
          {/* your mum */}
          <Person who="you" x={1025} y={296} r={34} width={96} height={130} tone="fill-sage" />
          {/* you */}
          <Person who="mary" x={1150} y={334} r={28} width={76} height={100} tone="fill-lantern" />
          {/* Mary */}
          <Person who="partner" x={1270} y={296} r={34} width={96} height={130} tone="fill-keepsake" />
          {/* your partner */}

          <rect x="852" y="466" width="18" height="234" className="fill-heartwood" />
          <rect x="1306" y="466" width="18" height="234" className="fill-heartwood" />
          <rect x="828" y="440" width="520" height="26" rx="8" className="fill-heartwood" />
          <Hand who="mum" x={940} y={440} />
          <Hand who="you" x={1060} y={440} />
          {/* kitchen table */}
          <Ball x={846} y={427} r={13} roll={-18} drop={260} travel={-120} />

          <Part name="biscuit">
            <Part name="biscuit-tail" pivot={[1004, 660]}>
              <path d="M1004 660q-24 -6 -21 -28" className="fill-none" />
            </Part>
            <Part name="biscuit-body" pivot={[1080, 698]}>
              <ellipse cx="1080" cy="668" rx="80" ry="30" className="fill-lantern" />
            </Part>
            <Part name="biscuit-head">
              <circle cx="1156" cy="672" r="26" className="fill-lantern" />
              <Part name="biscuit-ear" pivot={[1150, 640]}>
                <ellipse cx="1146" cy="654" rx="10" ry="17" transform="rotate(-25 1146 654)" className="fill-keepsake" />
              </Part>
              <path d="M1162 677q6 5 12 0" className="fill-none" />
            </Part>
          </Part>
          {/* Biscuit, asleep */}
        </>
      }
      portrait={
        <>
          <rect x="-400" y="-10" width="1700" height="2010" className="fill-paper stroke-none" />
          <rect x="-400" y="960" width="1700" height="1046" className="fill-blush" />
          <ellipse cx="450" cy="1000" rx="340" ry="64" className="fill-paper" />

          <rect x="600" y="150" width="180" height="130" rx="8" className="fill-blush" />

          <line x1="450" y1="-10" x2="450" y2="252" />
          <Part name="lamp-light">
            <polygon points="402,312 498,312 474,252 426,252" className="fill-lantern" />
          </Part>
          <Speck x={352} y={270} />
          <Speck x={542} y={238} />
          <Speck x={318} y={196} />
          <Speck x={566} y={300} />

          <Person who="mum" x={250} y={402} r={38} width={104} height={160} tone="fill-keepsake" />
          {/* your mum */}
          <Person who="you" x={383} y={402} r={38} width={104} height={160} tone="fill-sage" />
          {/* you */}
          <Person who="mary" x={517} y={444} r={31} width={84} height={124} tone="fill-lantern" />
          {/* Mary */}
          <Person who="partner" x={650} y={402} r={38} width={104} height={160} tone="fill-keepsake" />
          {/* your partner */}

          <rect x="196" y="594" width="20" height="396" className="fill-heartwood" />
          <rect x="684" y="594" width="20" height="396" className="fill-heartwood" />
          <rect x="170" y="566" width="560" height="28" rx="8" className="fill-heartwood" />
          <Hand who="mum" x={290} y={566} size={1.2} />
          <Hand who="you" x={423} y={566} size={1.2} />
          {/* kitchen table */}
          {/* On a phone the edges of the room are cropped, so the ball stops close to the table. */}
          <Ball x={178} y={551} r={15} roll={-8} drop={424} travel={-30} />

          <Part name="biscuit">
            <Part name="biscuit-tail" pivot={[349, 958]}>
              <path d="M349 958q-28 -8 -24 -34" className="fill-none" />
            </Part>
            <Part name="biscuit-body" pivot={[440, 1004]}>
              <ellipse cx="440" cy="968" rx="95" ry="36" className="fill-lantern" />
            </Part>
            <Part name="biscuit-head">
              <circle cx="530" cy="972" r="31" className="fill-lantern" />
              <Part name="biscuit-ear" pivot={[523, 932]}>
                <ellipse cx="518" cy="950" rx="12" ry="20" transform="rotate(-25 518 950)" className="fill-keepsake" />
              </Part>
              <path d="M537 978q7 6 14 0" className="fill-none" />
            </Part>
          </Part>
          {/* Biscuit, asleep */}
        </>
      }
    />
  );
}
