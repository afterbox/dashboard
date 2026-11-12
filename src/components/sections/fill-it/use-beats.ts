import { useEffect, useState, type RefObject } from "react";

/**
 * Where a beat is in its little play:
 *   0  waiting: its cards haven't arrived
 *   1  arrived: the card has turned over, slid in or stood up
 *   2  pressed: "Add it" is going down (only a beat with a button stops here)
 *   3  dropped: its cards are on their way into the box, or in it
 */
export type Step = 0 | 1 | 2 | 3;

// Where the middle of a beat's cards has to be, as a share of the space the
// beats have (under the nav, above the box), measured from the top.
const arrivesAt = 0.66;
const dropsAt = 0.42;

// Milliseconds. However fast the page is scrolled, a card finishes arriving
// before it is pressed, and is pressed before it drops.
const arriving = 700;
const pressing = 220;

/**
 * Each beat plays as it is scrolled into: its cards arrive as they come into
 * view, and drop into the box as they reach the middle. Scrolling back up
 * puts them back.
 *
 * It follows the scroll only while the section is on screen.
 */
export function useBeats(
  /** The section's layout: holds the cards, each set marked `data-slot`. */
  layout: RefObject<HTMLElement | null>,
  /** The box, which the beats scroll past. */
  stage: RefObject<HTMLElement | null>,
  /** Whether each beat has a button to press before it drops. */
  presses: readonly boolean[],
) {
  const [steps, setSteps] = useState<readonly Step[]>(() => presses.map(() => 0));

  useEffect(() => {
    const root = layout.current;
    const box = stage.current;
    if (!root || !box) return;

    const slots = [...root.querySelectorAll<HTMLElement>("[data-slot]")];
    const nav = document.querySelector<HTMLElement>("header");
    const now: Step[] = slots.map(() => 0);
    const wanted: Step[] = slots.map(() => 0);
    const since = slots.map(() => 0);
    const timers = slots.map(() => 0);

    const publish = () =>
      setSteps((before) => (before.every((step, i) => step === now[i]) ? before : [...now]));

    /** How long a beat stays on a step before it may move on. */
    const stays = (i: number) => (now[i] === 1 ? arriving : now[i] === 2 && presses[i] ? pressing : 0);

    // Back at once; forward one step at a time.
    const walk = (i: number) => {
      window.clearTimeout(timers[i]);
      if (wanted[i] < now[i]) now[i] = wanted[i];
      while (now[i] < wanted[i]) {
        const left = since[i] + stays(i) - performance.now();
        if (left > 0) {
          timers[i] = window.setTimeout(() => {
            walk(i);
            publish();
          }, left);
          return;
        }
        now[i] = (now[i] + 1) as Step;
        since[i] = performance.now();
      }
    };

    let near = false;
    let frame = 0;
    const measure = () => {
      frame = 0;
      if (!near || slots.length === 0) return;
      const screen = window.innerHeight;
      const top = nav?.getBoundingClientRect().bottom ?? 0;
      const panel = box.getBoundingClientRect();
      const column = slots[0].getBoundingClientRect();
      // Stacked, the beats have the space above the box; side by side, the whole screen.
      const beside = panel.left >= column.right || panel.right <= column.left;
      const bottom = beside ? screen : Math.min(screen, panel.top);
      const room = bottom - top;
      slots.forEach((slot, i) => {
        const { top: y, height } = slot.getBoundingClientRect();
        const middle = y + height / 2;
        wanted[i] = middle <= top + room * dropsAt ? 3 : middle <= top + room * arrivesAt ? 1 : 0;
        walk(i);
      });
      publish();
    };
    const queue = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    const watcher = new IntersectionObserver(([entry]) => {
      near = entry.isIntersecting;
      queue();
    });
    watcher.observe(root);
    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue);

    return () => {
      watcher.disconnect();
      window.removeEventListener("scroll", queue);
      window.removeEventListener("resize", queue);
      cancelAnimationFrame(frame);
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [layout, stage, presses]);

  return steps;
}
