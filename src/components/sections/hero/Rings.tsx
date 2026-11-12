import { motion, useTransform, type MotionValue } from "motion/react";
import { Plane } from "./Plane";
import { artboard, drawAt, lifeMoments, timeline, type Span } from "./timeline";

/**
 * The growth rings, oldest at the centre. Drawn in code so each ring can draw
 * itself in. Angles are in degrees, clockwise from the top.
 *
 * `opening` is the part of each ring left undrawn: where it faces, and how wide
 * it is. The rings open towards the headline (on the left in landscape, below
 * in portrait) rather than running through the words.
 *
 * `angle` is where a ring's label sits. Labels keep clear of the headline too.
 * `tightAngle` is where it sits on a short, wide screen (a phone held
 * sideways). There the note is big next to the rings and covers their lower
 * half, so every label moves to the upper right.
 *
 * On the very smallest screens the rings are too small to carry four labels
 * without them touching, so the labels are left out (see RingLabel).
 *
 * The line is held at 1.75px on screen, whatever size the rings are shown at
 * (`--stroke`, worked out in hero.css along with the frame's size, `--s`).
 */
const ringSets = {
  landscape: {
    ...artboard.landscape,
    opening: { facing: 270, size: 68 },
    rings: [
      { r: 205, angle: 40, tightAngle: 40 },
      { r: 260, angle: 158, tightAngle: 75 },
      { r: 315, angle: 48, tightAngle: 48 },
      { r: 370, angle: 146, tightAngle: 20 },
    ],
  },
  portrait: {
    ...artboard.portrait,
    opening: { facing: 180, size: 84 },
    // Left, right, left, right, each far enough round to clear the one inside it on a small phone.
    rings: [
      { r: 255, angle: 30, tightAngle: 30 },
      { r: 320, angle: -20, tightAngle: -20 },
      { r: 385, angle: 40, tightAngle: 40 },
      { r: 450, angle: -32, tightAngle: -32 },
    ],
  },
};

type RingSet = (typeof ringSets)[keyof typeof ringSets];
type Progress = { progress: MotionValue<number> };

export function Rings({ progress }: Progress) {
  return (
    <Plane name="rings" progress={progress} spec={timeline.rings} inFinalFrame>
      <RingSetView set={ringSets.landscape} progress={progress} className="portrait:hidden" />
      <RingSetView set={ringSets.portrait} progress={progress} className="landscape:hidden" />
    </Plane>
  );
}

type Point = { x: number; y: number };

/** The point on a ring at an angle, in degrees clockwise from the top. */
function pointOn(centre: Point, r: number, angle: number): Point {
  const radians = (angle * Math.PI) / 180;
  return { x: centre.x + r * Math.sin(radians), y: centre.y - r * Math.cos(radians) };
}

/** A ring as a path, drawn clockwise from one side of its opening round to the other. */
function ringPath(centre: Point, r: number, opening: RingSet["opening"]) {
  const at = (angle: number) => {
    const { x, y } = pointOn(centre, r, angle);
    return `${x.toFixed(2)} ${y.toFixed(2)}`;
  };
  const start = opening.facing + opening.size / 2;
  const sweep = 360 - opening.size;
  const arcTo = (angle: number) => `A${r} ${r} 0 0 1 ${at(angle)}`;
  // Two arcs, because a single arc can't turn more than half a circle cleanly.
  return `M${at(start)}${arcTo(start + sweep / 2)}${arcTo(start + sweep)}`;
}

/** As a percentage of a length, to two places. */
const percent = (part: number, whole: number) => Number(((part / whole) * 100).toFixed(2));

function RingSetView({ set, progress, className }: Progress & { set: RingSet; className: string }) {
  const { width, height, centre, opening, rings } = set;

  return (
    <div className={`absolute inset-0 ${className}`}>
      {/* `--s` is the final frame's size on this screen (hero.css). The rings shrink by it. */}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        aria-hidden
        focusable="false"
        className="absolute inset-0 size-full scale-(--s) overflow-visible fill-none [stroke-width:var(--stroke)] landscape:origin-[68%_50%] portrait:origin-[50%_36%]"
      >
        {rings.map((ring, i) => (
          <Ring
            key={ring.r}
            progress={progress}
            span={timeline.ringDraw[i]}
            d={ringPath(centre, ring.r, opening)}
            tone={i % 2 === 0 ? "stroke-heartwood" : "stroke-lantern"}
          />
        ))}
      </svg>

      {rings.map((ring, i) => {
        // From the shared centre, out along the ring. The distance shrinks with `--s`; the words don't.
        const place = (angle: number) => {
          const { x, y } = pointOn(centre, ring.r, angle);
          return {
            left: `calc(${percent(centre.x, width)}% + ${percent(x - centre.x, width)}% * var(--s))`,
            top: `calc(${percent(centre.y, height)}% + ${percent(y - centre.y, height)}% * var(--s))`,
          };
        };
        return (
          <RingLabel
            key={ring.r}
            progress={progress}
            span={timeline.ringDraw[i]}
            at={place(ring.angle)}
            tightAt={place(ring.tightAngle)}
          >
            {lifeMoments[i]}
          </RingLabel>
        );
      })}
    </div>
  );
}

type RingProps = Progress & { span: Span; d: string; tone: string };

function Ring({ progress, span, d, tone }: RingProps) {
  const pathLength = useTransform(progress, (p) => drawAt(span, p));
  const opacity = useTransform(pathLength, (drawn) => (drawn > 0 ? 1 : 0));

  return (
    <motion.path
      d={d}
      strokeLinecap="round"
      style={{ pathLength, opacity }}
      className={`${tone} motion-reduce:opacity-100! motion-reduce:[stroke-dasharray:none]!`}
    />
  );
}

type Place = { left: string; top: string };
type RingLabelProps = Progress & { span: Span; at: Place; tightAt: Place; children: string };

/**
 * A life moment, set into its ring. It fades in as the ring finishes drawing.
 * Left out where the rings are too small to hold the words: phones under 530px
 * tall upright, and under 360px tall sideways.
 */
function RingLabel({ progress, span, at, tightAt, children }: RingLabelProps) {
  const [, drawn] = span;
  const opacity = useTransform(progress, (p) => drawAt([drawn - 0.02, drawn + 0.02], p));

  // Both places go in as CSS variables; the classes below choose between them by screen.
  const places: Record<`--${string}`, string> = {
    "--x": at.left,
    "--y": at.top,
    "--x-tight": tightAt.left,
    "--y-tight": tightAt.top,
  };

  return (
    <motion.p
      style={{ opacity, ...places }}
      className="absolute top-(--y) left-(--x) -translate-x-1/2 -translate-y-1/2 bg-linen px-2 text-small/4 whitespace-nowrap text-ink-muted motion-reduce:opacity-100! landscape:tight:top-(--y-tight) landscape:tight:left-(--x-tight) landscape:squat:hidden portrait:tiny:hidden"
    >
      {children}
    </motion.p>
  );
}
