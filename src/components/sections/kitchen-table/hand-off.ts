import { useEffect, type RefObject } from "react";
import { useMotionValue, useSpring } from "motion/react";

/**
 * The hand-off to section 3. As "It doesn't have to be this way" comes up the
 * screen, the box fades in at Dad's place, and the scattered papers lift,
 * straighten and fly into it, one after another.
 *
 * It follows the scroll, like the hero's camera: 0 when the line first shows
 * at the bottom of the screen, 1 when it reaches the middle of the space the
 * words have. Scrolling back up puts the papers back. A soft spring sits
 * between the scroll and the papers, so they glide rather than jump.
 *
 * Reduced motion: none of this runs. CSS holds the last frame (the papers in
 * the box) from the first paint; see the art.
 */

// Shares of the hand-off, 0 to 1.
const boxFadesIn = [0, 0.2] as const;
/** The first paper leaves here, */
const firstLeaves = 0.12;
/** and each takes this long to reach the box. The last lands at 1. */
const flight = 0.44;
const topsShow = [0.8, 1] as const;

type Point = { x: number; y: number };
type Sheet = { el: SVGGElement; rest: Point; tilt: number; land: Point; over: Point };
type Board = {
  svg: SVGSVGElement;
  sheets: Sheet[];
  box: SVGGElement;
  tops: SVGGElement | null;
};

const clamp = (n: number) => Math.min(1, Math.max(0, n));
const span = ([from, to]: readonly [number, number], p: number) => clamp((p - from) / (to - from));
const smooth = (t: number) => t * t * (3 - 2 * t);

/** Where everything on one drawing is, in its own units. The art says (see KitchenNightArt). */
function read(svg: SVGSVGElement): Board | null {
  const box = svg.querySelector<SVGGElement>('[data-part="box"]');
  if (!box) return null;
  const [x, top, width] = (box.dataset.mouth ?? "").split(",").map(Number);
  const mouth = { x, y: top };

  const papers = [...svg.querySelectorAll<SVGGElement>('[data-part="paper"]')].map((el) => {
    const [px, py] = (el.dataset.at ?? "").split(",").map(Number);
    return { el, rest: { x: px, y: py }, tilt: Number(el.dataset.tilt ?? 0) };
  });
  // The nearest goes first.
  papers.sort((a, b) => Math.abs(a.rest.x - mouth.x) - Math.abs(b.rest.x - mouth.x));

  const sheets = papers.map((paper, i) => {
    const spread = papers.length > 1 ? i / (papers.length - 1) - 0.5 : 0;
    // It lands just inside, behind the front of the box,
    const land = { x: mouth.x + spread * width * 0.4, y: mouth.y + width * 0.3 };
    // and gets there over the top: the lower it starts, the higher it is thrown.
    const below = Math.max(0, paper.rest.y - mouth.y);
    const over = {
      x: mouth.x + (paper.rest.x - mouth.x) * 0.35,
      y: Math.min(paper.rest.y, mouth.y) - width * 1.45 - below * 0.6,
    };
    return { ...paper, land, over };
  });

  return { svg, sheets, box, tops: box.querySelector<SVGGElement>('[data-part="box-papers"]') };
}

function draw({ sheets, box, tops }: Board, p: number) {
  box.style.opacity = String(span(boxFadesIn, p));
  if (tops) tops.style.opacity = String(span(topsShow, p));

  const gap = sheets.length > 1 ? (1 - flight - firstLeaves) / (sheets.length - 1) : 0;
  sheets.forEach(({ el, rest, tilt, land, over }, i) => {
    const leaves = firstLeaves + gap * i;
    const t = smooth(span([leaves, leaves + flight], p));
    if (t === 0) {
      el.style.removeProperty("transform");
      el.style.removeProperty("opacity");
      return;
    }
    // One curve from where it lies, up over the box, and down into it.
    const a = (1 - t) * (1 - t);
    const b = 2 * (1 - t) * t;
    const c = t * t;
    const dx = a * rest.x + b * over.x + c * land.x - rest.x;
    const dy = a * rest.y + b * over.y + c * land.y - rest.y;
    const scale = 1 - 0.38 * t;
    el.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) rotate(${(-tilt * t).toFixed(1)}deg) scale(${scale.toFixed(3)})`;
    // Gone once it is behind the front of the box.
    el.style.opacity = String(1 - span([0.86, 1], t));
  });
}

function clear({ sheets, box, tops }: Board) {
  box.style.removeProperty("opacity");
  tops?.style.removeProperty("opacity");
  sheets.forEach(({ el }) => {
    el.style.removeProperty("transform");
    el.style.removeProperty("opacity");
  });
}

export function useHandOff(
  /** The section's layout: holds the line marked `data-turn`. */
  container: RefObject<HTMLElement | null>,
  /** The panel the art is in. */
  scene: RefObject<HTMLElement | null>,
  reduced: boolean,
) {
  const scrolled = useMotionValue(0);
  const progress = useSpring(scrolled, { stiffness: 70, damping: 22, restDelta: 0.0005 });

  useEffect(() => {
    const root = scene.current;
    const layout = container.current;
    const turn = layout?.querySelector<HTMLElement>("[data-turn]");
    if (reduced || !root || !layout || !turn) return;

    // The drawing on show (see quiet-life.ts). Read again whenever the panel changes shape.
    let board: Board | null = null;
    const find = () => {
      const boards = [...root.querySelectorAll<SVGSVGElement>("svg[data-board]")];
      const svg = boards.find((one) => one.getClientRects().length > 0);
      if (svg === board?.svg) return;
      if (board) clear(board);
      board = svg ? read(svg) : null;
    };
    const show = (p: number) => board && draw(board, p);

    // How far the line has come: from the bottom edge to the middle of the
    // space the words have. Stacked, that space starts under the scene;
    // side by side, under the nav.
    let near = false;
    let frame = 0;
    const measure = () => {
      frame = 0;
      if (!near) return;
      const line = turn.getBoundingClientRect();
      const panel = root.getBoundingClientRect();
      const screen = window.innerHeight;
      const beside = panel.left >= line.right || panel.right <= line.left;
      const top = beside ? panel.top : panel.bottom;
      const end = (top + screen) / 2 - line.height / 2;
      scrolled.set(end < screen ? clamp((screen - line.top) / (screen - end)) : 0);
    };
    const queue = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    const watcher = new IntersectionObserver(([entry]) => {
      near = entry.isIntersecting;
      queue();
    });
    watcher.observe(layout);
    const sizer = new ResizeObserver(() => {
      find();
      show(progress.get());
      queue();
    });
    sizer.observe(root);
    window.addEventListener("scroll", queue, { passive: true });
    const stop = progress.on("change", show);

    find();
    show(progress.get());

    return () => {
      watcher.disconnect();
      sizer.disconnect();
      window.removeEventListener("scroll", queue);
      cancelAnimationFrame(frame);
      stop();
      if (board) clear(board);
    };
  }, [container, scene, reduced, scrolled, progress]);
}
