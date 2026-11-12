import { useEffect, type RefObject } from "react";
import { liveBiscuit } from "../hero/ambient/behaviours";
import { Clock, type Piece } from "../hero/ambient/clock";

/**
 * Biscuit beside the box, while nobody scrolls: he breathes, and now and then
 * his ear twitches or his tail flicks, exactly as in the hero.
 *
 * The same rules as the hero (../hero/ambient/useAmbientLife.ts): it rests
 * when the scene is off-screen or the tab is hidden, and when `enabled` is
 * false (reduced motion) nothing starts.
 */
export function useFillLife(scene: RefObject<HTMLElement | null>, enabled: boolean) {
  useEffect(() => {
    const root = scene.current;
    if (!enabled || !root || typeof root.animate !== "function") return;

    const clock = new Clock();
    root.querySelectorAll<Piece>('[data-part="biscuit"]').forEach((biscuit) => liveBiscuit(clock, biscuit));

    let onScreen = false;
    const rest = () => {
      if (onScreen && !document.hidden) clock.resume();
      else clock.pause();
    };

    const watcher = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      rest();
    });
    watcher.observe(root);
    document.addEventListener("visibilitychange", rest);

    return () => {
      watcher.disconnect();
      document.removeEventListener("visibilitychange", rest);
      clock.stop();
    };
  }, [scene, enabled]);
}
