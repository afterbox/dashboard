import type { ReactNode } from "react";

/**
 * One layer of the zoom, drawn twice: landscape (1600 × 900) and portrait
 * (900 × 1600). Only the one that fits the screen is shown.
 *
 * Every layer shares these two artboards and the same centre point
 * (landscape 1088, 450; portrait 450, 576), so the commissioned SVGs can
 * replace the placeholders file for file. See `artboard` in ../timeline.ts.
 *
 * Portrait art is not clipped to its artboard. A tablet held upright is wider
 * than the artboard, and a phone whose toolbars have slid away is taller, so
 * backgrounds (sky, road, wall, floor) carry on 400 units past each side and
 * past the bottom: x from -400 to 1300, y to 2000.
 *
 * Anything that moves on its own is a named <Part>. Keep those names in the
 * final art and the ambient motion carries over (see ./Part.tsx).
 */
const frame =
  "absolute inset-0 size-full stroke-ink stroke-2 [stroke-linecap:round] [stroke-linejoin:round]";

export function Artboard({ landscape, portrait }: { landscape: ReactNode; portrait: ReactNode }) {
  return (
    <>
      <svg
        viewBox="0 0 1600 900"
        data-artboard="landscape"
        aria-hidden
        focusable="false"
        className={`${frame} portrait:hidden`}
      >
        {landscape}
      </svg>
      <svg
        viewBox="0 0 900 1600"
        data-artboard="portrait"
        aria-hidden
        focusable="false"
        className={`${frame} overflow-visible landscape:hidden`}
      >
        {portrait}
      </svg>
    </>
  );
}
