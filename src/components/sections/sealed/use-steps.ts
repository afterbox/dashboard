import { useEffect, useState, type RefObject } from "react";

/**
 * How many of `marks` the top edge of something has passed on its way up the
 * screen. Each mark is a share of the screen's height, measured from the top:
 * 0.8 is passed once the top edge is four fifths of the way down, or higher.
 */
export function marksPassed(marks: readonly number[]) {
  return (el: HTMLElement, screen: number) => {
    const { top } = el.getBoundingClientRect();
    return marks.filter((mark) => top <= mark * screen).length;
  };
}

/**
 * A scene that plays in steps as it is scrolled into, one after another.
 *
 * `wanted` says which step the page's position asks for. The scene walks
 * there one step at a time, holding each for `dwell` milliseconds, so however
 * fast the page is scrolled every step is seen, in order. Scrolling back up
 * takes it back at once. (The same walk as section 3's beats:
 * ../fill-it/use-beats.ts.)
 *
 * It follows the scroll only while the thing is on screen, and not at all
 * when `enabled` is false (reduced motion: CSS holds the last frame).
 */
export function useSteps(
  target: RefObject<HTMLElement | null>,
  /** Must be the same function each render. */
  wanted: (el: HTMLElement, screen: number) => number,
  dwell: number,
  enabled = true,
) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const el = target.current;
    if (!enabled || !el) return;

    let now = 0;
    let want = 0;
    let since = 0;
    let timer = 0;
    let frame = 0;
    let near = false;

    // Back at once; forward one step at a time.
    const walk = () => {
      window.clearTimeout(timer);
      if (want < now) now = want;
      else if (want > now) {
        const left = since + dwell - performance.now();
        if (left > 0) timer = window.setTimeout(walk, left);
        else {
          now += 1;
          since = performance.now();
          if (want > now) timer = window.setTimeout(walk, dwell);
        }
      }
      setStep(now);
    };

    const measure = () => {
      frame = 0;
      want = wanted(el, window.innerHeight);
      walk();
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

    return () => {
      watcher.disconnect();
      window.removeEventListener("scroll", follow);
      window.removeEventListener("resize", queue);
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [target, wanted, dwell, enabled]);

  return step;
}
