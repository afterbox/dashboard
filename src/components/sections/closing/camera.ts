import { timeline, type Span } from "../hero/timeline";

/**
 * The closing scene's camera: the hero's, run backwards.
 *
 * The hero's timeline (../hero/timeline.ts) is the one source for where every
 * layer is at each camera position, from 0 (the street) to 1 (the box, the
 * note, the rings). This scene never restates it. It only says which of those
 * positions the camera is at for each point in its own, shorter, scroll.
 */

/** Where the hero's camera rests on the street. */
const [[street]] = timeline.street.scale;
/** The box settled in its rings with its note showing, before the hero's words arrive. */
const [, [box]] = timeline.note;

/** The camera position the scene opens on: the box. */
export const opensOn: number = box;
/** The camera position it ends on, and the one frame shown when motion is reduced: the house at night. */
export const endsOn: number = street;

/** In this scene's own scroll, 0 to 1: a breath on the box, the pull back, then the words. */
const pullBack: Span = [0.06, 0.8];
export const words = {
  headline: [0.8, 0.9],
  cta: [0.84, 0.94],
} as const satisfies Record<string, Span>;

/** Which of the hero's camera positions this scene is at, for how far it has scrolled. */
export function cameraAt(scrolled: number) {
  const [start, end] = pullBack;
  const t = Math.min(1, Math.max(0, (scrolled - start) / (end - start)));
  return opensOn + (endsOn - opensOn) * t;
}
