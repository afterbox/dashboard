import { useEffect, type RefObject } from "react";

/**
 * The hand-off to section 5. As the box comes up the screen, Dad's three
 * letters lift from beside it and slide in, one after another, and then the
 * lid begins to come down. Section 5 finishes closing it and ties the ribbon.
 *
 * The same flight as the papers at the end of section 2
 * (../kitchen-table/hand-off.ts), slower and with no throw to it: each letter
 * rises only just over the rim.
 *
 * It plays once the whole box is on screen, in its own time, like the beats
 * of section 3: there may be very little page left under it to scroll
 * through. Scrolling back up, until the box has all but left the screen, takes
 * the letters out again.
 *
 * Reduced motion: none of this runs. The art holds the last frame (the
 * letters in the box, the lid part-closed) from the first paint.
 */

/** Milliseconds: the whole hand-off, and putting it all back. */
const takes = 4200;
const undoing = 1200;

/** How much of the box scene has to be on screen for it to play, and how little for it to be undone. */
const playsAt = 0.85;
const undoneAt = 0.3;

// Shares of the hand-off, 0 to 1.
/** The first letter leaves here, */
const firstLeaves = 0.06;
/** and each takes this long to reach the box. */
const flight = 0.4;
/** The last is in by here; then the lid moves. */
const lidMoves = [0.74, 1] as const;

/** How the lid stands, in degrees: open, and as far as this section closes it. */
const lid = { open: -32, closing: -14 } as const;

type Point = { x: number; y: number };
type Letter = { el: SVGGElement; rest: Point; tilt: number; land: Point; over: Point };
type Board = { letters: Letter[]; lid: SVGGElement | null };

const clamp = (n: number) => Math.min(1, Math.max(0, n));
const span = ([from, to]: readonly [number, number], p: number) => clamp((p - from) / (to - from));
const smooth = (t: number) => t * t * (3 - 2 * t);

/** Where everything is, in the board's own units. The art says (see ../box/BoxSceneArt.tsx). */
function read(root: HTMLElement): Board | null {
  const svg = root.querySelector<SVGSVGElement>("svg[data-mouth]");
  if (!svg) return null;
  const [x, top, width] = (svg.dataset.mouth ?? "").split(",").map(Number);
  const mouth = { x, y: top };

  const waiting = [...svg.querySelectorAll<SVGGElement>('[data-part="envelope"]')].map((el) => {
    const [px, py] = (el.dataset.at ?? "").split(",").map(Number);
    return { el, rest: { x: px, y: py }, tilt: Number(el.dataset.tilt ?? 0) };
  });
  // The nearest goes first.
  waiting.sort((a, b) => Math.abs(a.rest.x - mouth.x) - Math.abs(b.rest.x - mouth.x));

  const letters = waiting.map((letter, i) => {
    const spread = waiting.length > 1 ? i / (waiting.length - 1) - 0.5 : 0;
    // It comes to rest just inside, behind the front of the box,
    const land = { x: mouth.x + spread * width * 0.3, y: mouth.y + width * 0.22 };
    // and gets there over the rim.
    const over = { x: mouth.x + (letter.rest.x - mouth.x) * 0.3, y: mouth.y - width * 0.62 };
    return { ...letter, land, over };
  });

  return { letters, lid: svg.querySelector<SVGGElement>('[data-part="box-lid"]') };
}

function draw({ letters, lid: lidPart }: Board, p: number) {
  const gap = letters.length > 1 ? (lidMoves[0] - flight - firstLeaves) / (letters.length - 1) : 0;
  letters.forEach(({ el, rest, tilt, land, over }, i) => {
    const leaves = firstLeaves + gap * i;
    const t = smooth(span([leaves, leaves + flight], p));
    if (t === 0) {
      el.style.removeProperty("transform");
      el.style.removeProperty("opacity");
      return;
    }
    // One curve from where it lies, up over the rim, and down into the box.
    const a = (1 - t) * (1 - t);
    const b = 2 * (1 - t) * t;
    const c = t * t;
    const dx = a * rest.x + b * over.x + c * land.x - rest.x;
    const dy = a * rest.y + b * over.y + c * land.y - rest.y;
    const scale = 1 - 0.18 * t;
    el.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) rotate(${(-tilt * t).toFixed(1)}deg) scale(${scale.toFixed(3)})`;
    // Gone once it is behind the front of the box.
    el.style.opacity = String(1 - span([0.9, 1], t));
  });

  if (lidPart) {
    const t = smooth(span(lidMoves, p));
    if (t === 0) lidPart.style.removeProperty("rotate");
    else lidPart.style.rotate = `${(lid.open + (lid.closing - lid.open) * t).toFixed(2)}deg`;
  }
}

function putBack({ letters, lid: lidPart }: Board) {
  lidPart?.style.removeProperty("rotate");
  letters.forEach(({ el }) => {
    el.style.removeProperty("transform");
    el.style.removeProperty("opacity");
  });
}

export function useIntoTheBox(
  /** The strip the box scene is in. */
  scene: RefObject<HTMLElement | null>,
  enabled: boolean,
) {
  useEffect(() => {
    const root = scene.current;
    if (!enabled || !root) return;
    const board = read(root);
    if (!board) return;

    // Where the hand-off has got to, and where it is heading: 0, nothing has moved; 1, done.
    let share = 0;
    let heading = 0;
    let frame = 0;
    let before = 0;
    const step = (now: number) => {
      const passed = now - before;
      before = now;
      share = heading > share ? Math.min(heading, share + passed / takes) : Math.max(heading, share - passed / undoing);
      draw(board, share);
      frame = share === heading ? 0 : requestAnimationFrame(step);
    };
    const head = (to: number) => {
      heading = to;
      if (frame || share === heading) return;
      before = performance.now();
      frame = requestAnimationFrame(step);
    };

    const watcher = new IntersectionObserver(
      ([entry]) => {
        // Scrolled past, off the top, counts as seen.
        if (entry.intersectionRatio >= playsAt || entry.boundingClientRect.top < 0) head(1);
        else if (entry.intersectionRatio < undoneAt) head(0);
      },
      { threshold: [undoneAt, playsAt] },
    );
    watcher.observe(root);

    return () => {
      watcher.disconnect();
      cancelAnimationFrame(frame);
      putBack(board);
    };
  }, [scene, enabled]);
}
