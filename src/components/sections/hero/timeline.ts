/**
 * The hero zoom, in one place.
 *
 * Every position is a fraction of the pinned scroll: 0 is the street at dusk,
 * 1 is the final frame (box, note, rings, headline). To retune the scene, or to
 * make room for the hand-off into section 2, change the numbers here.
 */

/** [where in the scroll, value there] */
export type Stop = readonly [at: number, value: number];
export type Track = readonly Stop[];
export type Span = readonly [start: number, end: number];
export type PlaneSpec = { readonly scale: Track; readonly opacity: Track };

/**
 * The artboards every layer is drawn on, and the one point they all scale about.
 * The point is the window, then the table, then the centre of the rings, then the box.
 * Landscape: 68% across, 50% down. Portrait: 50% across, 36% down.
 * (Plane.tsx repeats these as transform-origin classes; keep the two in step.)
 *
 * `drawn` is how far the art reaches from side to side. Portrait art carries on
 * 400 units past each edge of its artboard (see art/Artboard.tsx). The clouds
 * never drift further than this.
 */
export const artboard = {
  landscape: {
    width: 1600,
    height: 900,
    centre: { x: 1088, y: 450 },
    drawn: { left: 0, right: 1600 },
  },
  portrait: {
    width: 900,
    height: 1600,
    centre: { x: 450, y: 576 },
    drawn: { left: -400, right: 1300 },
  },
} as const;

export const timeline = {
  // 0.00 to 0.05: rest on the street.
  // 0.05 to 0.38: push into the house and through the lit window.
  street: {
    scale: [[0.05, 1], [0.38, 1.8]],
    opacity: [[0.2, 1], [0.3, 0]],
  },
  house: {
    scale: [[0.05, 1], [0.38, 9]],
    opacity: [[0.32, 1], [0.38, 0]],
  },
  window: {
    scale: [[0.05, 1], [0.38, 11]],
    opacity: [[0.28, 1], [0.36, 0]],
  },
  // Seen small through the window, then 0.38 to 0.48: a slower beat on the family.
  // 0.50 to 0.60: the camera passes the table.
  table: {
    scale: [[0.05, 0.16], [0.38, 1], [0.48, 1.1], [0.6, 2.6]],
    opacity: [[0.5, 1], [0.6, 0]],
  },
  // 0.52 to 0.81: the rings draw outward, oldest first.
  rings: {
    scale: [[0.52, 0.4], [0.84, 1]],
    opacity: [[0.5, 0], [0.52, 1]],
  },
  ringDraw: [
    [0.52, 0.6],
    [0.59, 0.67],
    [0.66, 0.74],
    [0.73, 0.81],
  ],
  // 0.72 to 0.90: the box arrives and settles with a tiny overshoot.
  box: {
    scale: [[0.72, 0.55], [0.8, 0.9], [0.86, 1.03], [0.9, 1]],
    opacity: [[0.72, 0], [0.78, 1]],
  },
  note: [[0.86, 0], [0.91, 1]],
  // 0.89 to 0.98: headline, then sub-line, then the button. 0.98 to 1: rest.
  headline: [0.89, 0.94],
  subline: [0.91, 0.96],
  cta: [0.93, 0.98],
} as const satisfies Record<string, PlaneSpec | Track | Span | readonly Span[]>;

/** The room has come into view through the window: the ball rolls off the table. Once only. */
export const ballFallsAt = 0.36;

/** Life moments, from the oldest ring outward. */
export const lifeMoments = ["bought a home", "Mary is born", "a new job", "Mary turns 10"] as const;

function between(track: Track, p: number) {
  const first = track[0];
  const last = track[track.length - 1];
  if (p <= first[0]) return { from: first[1], to: first[1], t: 0 };
  if (p >= last[0]) return { from: last[1], to: last[1], t: 0 };
  let i = 1;
  while (track[i][0] < p) i++;
  const [startAt, from] = track[i - 1];
  const [endAt, to] = track[i];
  return { from, to, t: (p - startAt) / (endAt - startAt) };
}

/** Scale along a track. Multiplies rather than adds, so the camera moves at a steady pace. */
export function zoomAt(track: Track, p: number) {
  const { from, to, t } = between(track, p);
  return from * Math.pow(to / from, t);
}

/** A straight fade along a track. */
export function fadeAt(track: Track, p: number) {
  const { from, to, t } = between(track, p);
  return from + (to - from) * t;
}

/** 0 to 1 across a span, easing in and out. For lines being drawn. */
export function drawAt([start, end]: Span, p: number) {
  const t = Math.min(1, Math.max(0, (p - start) / (end - start)));
  return t * t * (3 - 2 * t);
}

/** 0 to 1 across a span, easing out. For things rising into place. */
export function riseAt([start, end]: Span, p: number) {
  const t = Math.min(1, Math.max(0, (p - start) / (end - start)));
  return 1 - Math.pow(1 - t, 3);
}
