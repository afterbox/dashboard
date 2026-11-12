import { useEffect, type RefObject } from "react";
import type { MotionValue } from "motion/react";
import { artboard, fadeAt, timeline, type PlaneSpec } from "../timeline";
import {
  driftClouds,
  flicker,
  liveBird,
  liveBiscuit,
  livePerson,
  swayTree,
  twinkle,
} from "./behaviours";
import { Clock, type Piece } from "./clock";

type Orientation = keyof typeof artboard;
type Layer = { clock: Clock; spec: PlaneSpec };

/** The layers with something alive on them, by their `data-plane` name. */
const planes: Record<string, PlaneSpec> = {
  street: timeline.street,
  house: timeline.house,
  window: timeline.window,
  table: timeline.table,
};

/**
 * How much of the art's width is on screen, in artboard units, before any zoom.
 * A phone held upright shows well under half of what's drawn, so clouds that
 * crossed the whole drawing would leave the sky empty most of the time.
 */
function edgesInView(stage: HTMLElement, plane: HTMLElement, orientation: Orientation) {
  const { width, drawn } = artboard[orientation];
  const unit = plane.offsetWidth / width;
  if (!unit) return drawn;
  // The artboard is centred on the stage.
  const half = stage.clientWidth / 2 / unit;
  return {
    left: Math.max(drawn.left, width / 2 - half),
    right: Math.min(drawn.right, width / 2 + half),
  };
}

/** Find every named part on one layer's art and set it going. */
function bringToLife(clock: Clock, art: SVGSVGElement, edges: { left: number; right: number }) {
  const all = (name: string) => [...art.querySelectorAll<Piece>(`[data-part="${name}"]`)];

  driftClouds(clock, all("cloud"), edges);
  all("speck").forEach((speck) => twinkle(clock, speck));
  all("tree").forEach((tree) => swayTree(clock, tree));
  all("bird").forEach((bird) => liveBird(clock, bird));
  all("window-light").forEach((light) => flicker(clock, light));
  all("lamp-light").forEach((light) => flicker(clock, light));
  all("biscuit").forEach((biscuit) => liveBiscuit(clock, biscuit));

  const hands = all("person-hand");
  all("person").forEach((person) => {
    const hand = hands.find((one) => one.dataset.who === person.dataset.who) ?? null;
    livePerson(clock, person, hand);
  });
}

/**
 * The small life of the hero: clouds, stars, the bird, the tree, the family,
 * Biscuit, the lamps. None of it is tied to the scroll.
 *
 * It rests whenever nobody can see it: when the hero is off-screen, when the
 * tab is hidden, and layer by layer once the camera has passed. Only the art
 * for the way the screen is held is animated. When `enabled` is false
 * (reduced motion) nothing starts at all.
 */
export function useAmbientLife(
  stage: RefObject<HTMLElement | null>,
  progress: MotionValue<number>,
  enabled: boolean,
) {
  useEffect(() => {
    const root = stage.current;
    if (!enabled || !root || typeof root.animate !== "function") return;

    const portrait = window.matchMedia("(orientation: portrait)");
    let layers: Layer[] = [];
    let onScreen = false;

    const rest = () => {
      const awake = onScreen && !document.hidden;
      const p = progress.get();
      layers.forEach(({ clock, spec }) => {
        if (awake && fadeAt(spec.opacity, p) > 0) clock.resume();
        else clock.pause();
      });
    };

    const start = () => {
      layers.forEach(({ clock }) => clock.stop());
      layers = [];
      const orientation: Orientation = portrait.matches ? "portrait" : "landscape";
      root.querySelectorAll<HTMLElement>("[data-plane]").forEach((plane) => {
        const spec = planes[plane.dataset.plane ?? ""];
        const art = plane.querySelector<SVGSVGElement>(`svg[data-artboard="${orientation}"]`);
        if (!spec || !art) return;
        const clock = new Clock();
        bringToLife(clock, art, edgesInView(root, plane, orientation));
        layers.push({ clock, spec });
      });
      rest();
    };

    const watcher = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      rest();
    });
    watcher.observe(root);

    const stopWatchingScroll = progress.on("change", rest);
    document.addEventListener("visibilitychange", rest);
    portrait.addEventListener("change", start);
    start();

    return () => {
      watcher.disconnect();
      stopWatchingScroll();
      document.removeEventListener("visibilitychange", rest);
      portrait.removeEventListener("change", start);
      layers.forEach(({ clock }) => clock.stop());
    };
  }, [stage, progress, enabled]);
}
