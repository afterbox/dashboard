import { useEffect, type RefObject } from "react";
import { livePerson } from "../hero/ambient/behaviours";
import { Clock, type Piece } from "../hero/ambient/clock";

/**
 * Section 4 while nobody scrolls. Mary breathes and blinks, as she does at
 * the table in the hero, and the voice note's waveform breathes: a rise of a
 * few parts in a hundred, there and back. Nothing else moves on its own.
 *
 * The same rules as the hero (../hero/ambient/useAmbientLife.ts): it rests
 * when the section is off-screen or the tab is hidden, and when `enabled` is
 * false (reduced motion) nothing starts.
 */
export function useSayLife(section: RefObject<HTMLElement | null>, enabled: boolean) {
  useEffect(() => {
    const root = section.current;
    if (!enabled || !root || typeof root.animate !== "function") return;

    const clock = new Clock();
    root.querySelectorAll<Piece>('[data-part="person"]').forEach((person) => livePerson(clock, person, null));
    root.querySelectorAll<Piece>('[data-part="wave"]').forEach((wave) => {
      const breath = clock.play(wave, [{ transform: "scaleY(1)" }, { transform: "scaleY(1.07)" }], {
        duration: 2100,
        direction: "alternate",
        iterations: Infinity,
        easing: "ease-in-out",
      });
      breath.currentTime = Math.random() * 4200;
    });

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
  }, [section, enabled]);
}
