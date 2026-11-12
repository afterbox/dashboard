/**
 * The brand's easing curves, for motion written in script rather than CSS.
 * They mirror --ease-gift, --ease-state and --ease-play in src/app/globals.css.
 * Keep the two in step.
 */
export const ease = {
  /** A soft ease-out: arriving. */
  gift: "cubic-bezier(0.22, 1, 0.36, 1)",
  /** Ease in and out: there and back, changing state. */
  state: "cubic-bezier(0.65, 0, 0.35, 1)",
  /** A small overshoot. Gift mode only. */
  play: "cubic-bezier(0.34, 1.56, 0.64, 1)",
} as const;
