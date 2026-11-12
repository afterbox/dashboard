"use client";

import { useRef, type ReactNode } from "react";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";
import { useHandOff } from "./hand-off";
import { useQuietLife } from "./quiet-life";
import "./kitchen-table.css";

type Props = {
  /** The night kitchen, passed in already rendered so the art stays out of the script bundle. */
  art: ReactNode;
  /** The words. One of them is marked `data-turn`: the line the hand-off follows. */
  children: ReactNode;
};

/**
 * The scene and the words. The scene stays on screen while the words scroll
 * past it in the ordinary way; nothing is pinned and nothing waits.
 *
 * Stacked (a phone or tablet held upright): the scene is a strip under the
 * nav and the words pass beneath it.
 * Beside (held sideways, or a wide screen): the words on the left, the scene
 * a tall panel on the right.
 *
 * kitchen-table.css sizes the scene for each.
 */
export function KitchenStage({ art, children }: Props) {
  const layout = useRef<HTMLDivElement>(null);
  const scene = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  useQuietLife(scene, !reduced);
  useHandOff(layout, scene, reduced);

  return (
    <div
      ref={layout}
      className="kitchen-table mx-auto w-full max-w-300 px-5 pt-6 md:px-6 lg:pt-24 beside:grid beside:grid-cols-2 beside:gap-x-6 beside:pb-12 lg:gap-x-12 lg:pb-24"
    >
      {/* Stacked, this is also the linen the words slide under: it reaches both edges of the screen. */}
      <div className="sticky top-(--kt-top) z-10 -mx-5 bg-linen px-5 pt-2 md:-mx-6 md:px-6 beside:col-start-2 beside:row-start-1 beside:mx-0 beside:self-start beside:px-0 beside:pt-0">
        <div
          ref={scene}
          role="img"
          aria-label="The same kitchen, at night, with one lamp on. Someone sits at the table with a laptop and a notepad, beside an empty chair. Papers are scattered around her. Biscuit the dog lies still underneath."
          className="kitchen-night @container-[size]/night relative h-(--kt-h) overflow-hidden rounded-lg beside:rounded-xl"
        >
          {art}
        </div>
        {/* The words fade out as they reach the scene, rather than being cut off. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-full h-6 bg-linear-to-b from-linen to-transparent beside:hidden"
        />
      </div>

      <div className="beside:col-start-1 beside:row-start-1">{children}</div>
    </div>
  );
}
