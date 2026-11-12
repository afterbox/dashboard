import { useEffect, type RefObject } from "react";
import type { MotionValue } from "motion/react";
import { ballFallsAt } from "./timeline";

/**
 * The ball on the kitchen table. When the room comes into view it rolls off
 * the edge, drops, bounces twice and comes to rest on the floor.
 *
 * It only ever happens once. `fallen` is held for the session: after the ball
 * has gone, it stays on the floor whatever the scroll does next. A reload
 * starts again.
 */
let fallen = false;

// Seconds. The drop always takes `fall`; gravity follows from the height.
const fall = 0.44;
// How high each bounce comes back, as a share of the drop.
const rebounds = [0.3, 0.1];
// Rolling to a stop on the floor.
const settle = 0.55;

type Flight = { frames: Keyframe[]; duration: number; rest: string };

/**
 * The whole path, sampled sixty times a second, so the sideways drift stays
 * even while the height speeds up and slows down the way a real drop does
 * (ease-in going down, ease-out coming up).
 *
 * The art says how far (see Ball in art/Part.tsx), in artboard units:
 *   roll    from where it rests to the table's edge (negative is leftwards)
 *   drop    from the table to the floor
 *   travel  from the edge to where it stops
 */
function flight(ball: SVGGElement): Flight {
  const roll = Number(ball.dataset.roll);
  const drop = Number(ball.dataset.drop);
  const travel = Number(ball.dataset.travel);
  const radius = Number(ball.dataset.radius);
  const way = Math.sign(roll) || -1;

  const gravity = (2 * drop) / fall ** 2;
  const hangs = rebounds.map((share) => 2 * fall * Math.sqrt(share));
  const air = fall + hangs.reduce((sum, hang) => sum + hang, 0);
  // One steady sideways speed from the edge until it starts to slow on the floor.
  const speed = Math.abs(travel) / (air + settle / 2);
  // Rolling to the edge, gathering that speed from rest.
  const run = (2 * Math.abs(roll)) / speed;
  const total = run + air + settle;

  const at = (t: number) => {
    if (t < run) return { x: (speed / run / 2) * t * t, y: 0 };

    const toEdge = Math.abs(roll);
    let u = t - run;
    if (u < fall) return { x: toEdge + speed * u, y: (gravity / 2) * u * u };

    let v = u - fall;
    for (const hang of hangs) {
      if (v < hang) {
        const launch = (gravity * hang) / 2;
        return { x: toEdge + speed * u, y: drop - (launch * v - (gravity / 2) * v * v) };
      }
      v -= hang;
    }

    u = Math.min(t - run - air, settle);
    return { x: toEdge + speed * air + speed * u - (speed / settle / 2) * u * u, y: drop };
  };

  const pose = (t: number) => {
    const { x, y } = at(t);
    // It turns as far as it has travelled.
    const turn = (way * x * 180) / (Math.PI * radius);
    return `translate(${(way * x).toFixed(1)}px, ${y.toFixed(1)}px) rotate(${turn.toFixed(1)}deg)`;
  };

  const steps = Math.ceil(total * 60);
  const frames = Array.from({ length: steps + 1 }, (_, i) => ({
    transform: pose((total * i) / steps),
  }));

  return { frames, duration: total * 1000, rest: pose(total) };
}

export function useBall(
  stage: RefObject<HTMLElement | null>,
  progress: MotionValue<number>,
  reduced: boolean,
) {
  useEffect(() => {
    const root = stage.current;
    if (!root) return;
    // One ball in each drawing (landscape and portrait). Both end up on the floor.
    const balls = [...root.querySelectorAll<SVGGElement>('[data-part="ball"]')];

    const land = (watchIt: boolean) => {
      fallen = true;
      balls.forEach((ball) => {
        const { frames, duration, rest } = flight(ball);
        // Where it stays, set first, so nothing can leave it mid-air.
        ball.style.transform = rest;
        const showing = ball.getClientRects().length > 0;
        if (watchIt && showing && typeof ball.animate === "function") {
          ball.animate(frames, { duration, easing: "linear" });
        }
      });
    };

    // Already down, or motion is reduced: on the floor, no fall.
    if (fallen || reduced) {
      land(false);
      return;
    }

    const watch = (p: number) => {
      if (!fallen && p >= ballFallsAt) land(true);
    };
    watch(progress.get());
    return progress.on("change", watch);
  }, [stage, progress, reduced]);
}
