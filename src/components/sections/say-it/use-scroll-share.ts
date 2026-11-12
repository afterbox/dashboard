import { useEffect, useState, type RefObject } from "react";
import { useMotionValue, useSpring } from "motion/react";

const clamp = (n: number) => Math.min(1, Math.max(0, n));

/**
 * How far something has come up the screen, as a share from 0 to 1: 0 when
 * its top edge is `from` of the way down the screen, 1 when it is `to` of the
 * way down. Scrolling back up takes it back.
 *
 * The same soft spring as section 2's hand-off sits between the scroll and
 * the share (../kitchen-table/hand-off.ts), so what follows it glides rather
 * than jumps. It is tuned not to overshoot: nothing in this section bounces.
 *
 * It follows the scroll only while the thing is on screen, and not at all
 * when `enabled` is false (reduced motion: CSS holds the last frame).
 */
export function useScrollShare(
  target: RefObject<HTMLElement | null>,
  [from, to]: readonly [number, number],
  /** Draw this share. Called on every change, so keep it to styles; it must be the same function each render. */
  show: (share: number) => void,
  enabled: boolean,
  /** Put back whatever `show` changed. */
  clear?: () => void,
) {
  const scrolled = useMotionValue(0);
  const share = useSpring(scrolled, { stiffness: 70, damping: 22, restDelta: 0.0005 });

  useEffect(() => {
    const el = target.current;
    if (!enabled || !el) return;

    let near = false;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const screen = window.innerHeight;
      const { top } = el.getBoundingClientRect();
      // Off screen there is nothing to follow: it is either still to come, or done.
      if (!near) scrolled.set(top < 0 ? 1 : 0);
      else scrolled.set(clamp((from * screen - top) / ((from - to) * screen)));
    };
    const queue = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    const follow = () => near && queue();

    const watcher = new IntersectionObserver(([entry]) => {
      near = entry.isIntersecting;
      queue();
    });
    watcher.observe(el);
    window.addEventListener("scroll", follow, { passive: true });
    window.addEventListener("resize", queue);
    const stop = share.on("change", show);
    show(share.get());

    return () => {
      watcher.disconnect();
      window.removeEventListener("scroll", follow);
      window.removeEventListener("resize", queue);
      cancelAnimationFrame(frame);
      stop();
      clear?.();
    };
  }, [target, from, to, show, enabled, clear, scrolled, share]);
}

/**
 * True once something has come `at` of the way up the screen (or gone past
 * the top of it), false again when it is scrolled back down.
 */
export function useArrived(target: RefObject<HTMLElement | null>, at = 0.2) {
  const [arrived, setArrived] = useState(false);

  useEffect(() => {
    const el = target.current;
    if (!el) return;
    const watcher = new IntersectionObserver(
      ([entry]) => setArrived(entry.isIntersecting || entry.boundingClientRect.top < 0),
      // Shrink the screen from the bottom, so "on screen" means this far up it.
      { rootMargin: `0px 0px -${Math.round(at * 100)}% 0px` },
    );
    watcher.observe(el);
    return () => watcher.disconnect();
  }, [target, at]);

  return arrived;
}
