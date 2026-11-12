import { useEffect, type RefObject } from "react";
import { breatheBiscuit, breatheSeated, flicker } from "../hero/ambient/behaviours";
import { Clock, type Piece } from "../hero/ambient/clock";

/**
 * The little that moves in the night kitchen while nobody scrolls: the lamp
 * flickers very softly, Mary's mum breathes, Biscuit breathes. Nothing else.
 *
 * The same rules as the hero (../hero/ambient/useAmbientLife.ts): it rests
 * when the scene is off-screen or the tab is hidden, only the drawing on show
 * is animated, and when `enabled` is false (reduced motion) nothing starts.
 */
export function useQuietLife(scene: RefObject<HTMLElement | null>, enabled: boolean) {
  useEffect(() => {
    const root = scene.current;
    if (!enabled || !root || typeof root.animate !== "function") return;

    let clock: Clock | null = null;
    let showing: SVGSVGElement | null = null;
    let onScreen = false;

    const rest = () => {
      if (onScreen && !document.hidden) clock?.resume();
      else clock?.pause();
    };

    // Whichever drawing fits the panel's shape. Starts again if that changes.
    const start = () => {
      const boards = [...root.querySelectorAll<SVGSVGElement>("svg[data-board]")];
      const art = boards.find((board) => board.getClientRects().length > 0) ?? null;
      if (art === showing) return;
      clock?.stop();
      clock = null;
      showing = art;
      if (!art) return;

      const lively = new Clock();
      const all = (name: string) => [...art.querySelectorAll<Piece>(`[data-part="${name}"]`)];
      all("lamp-light").forEach((light) => flicker(lively, light));
      all("person").forEach((person) => breatheSeated(lively, person));
      all("biscuit").forEach((biscuit) => breatheBiscuit(lively, biscuit));
      clock = lively;
      rest();
    };

    const watcher = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      rest();
    });
    watcher.observe(root);
    const sizer = new ResizeObserver(start);
    sizer.observe(root);
    document.addEventListener("visibilitychange", rest);
    start();

    return () => {
      watcher.disconnect();
      sizer.disconnect();
      document.removeEventListener("visibilitychange", rest);
      clock?.stop();
    };
  }, [scene, enabled]);
}
