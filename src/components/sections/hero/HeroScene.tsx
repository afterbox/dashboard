"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useMotionValue, useScroll } from "motion/react";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";
import { useAmbientLife } from "./ambient/useAmbientLife";
import { useBall } from "./ball";
import { BoxAndNote } from "./BoxAndNote";
import { HeroCopy } from "./HeroCopy";
import { Plane } from "./Plane";
import { Rings } from "./Rings";
import { zoomStarted } from "./signals";
import { timeline } from "./timeline";
import "./hero.css";

type Props = {
  /** The illustrated layers, passed in already rendered so the art stays out of the script bundle. */
  street: ReactNode;
  house: ReactNode;
  windowFrame: ReactNode;
  table: ReactNode;
  box: ReactNode;
};

/**
 * The pinned zoom. A tall track scrolls past a stage that sticks to the top of
 * the screen; how far the track has travelled is the camera position.
 * Pinned for 250 screen-heights in landscape and 180 in portrait.
 */
export function HeroScene({ street, house, windowFrame, table, box }: Props) {
  const track = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const screen = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({ target: track, offset: ["start start", "end end"] });
  // The camera position, 0 to 1. Reduced motion: no camera, hold the final frame.
  const progress = useMotionValue(0);

  useEffect(() => {
    const show = (p: number) => progress.set(reduced ? 1 : p);

    // Where the scroll is right now, read straight from the page. Turning
    // reduced motion on or off changes the track's height without a scroll, so
    // the frame is redrawn here, at once, rather than at the next scroll.
    const el = track.current;
    if (el) {
      const { top, height } = el.getBoundingClientRect();
      const run = height - document.documentElement.clientHeight;
      show(run > 0 ? Math.min(1, Math.max(0, -top / run)) : 0);
    }

    return scrollYProgress.on("change", show);
  }, [reduced, scrollYProgress, progress]);

  // Tell the nav once the camera leaves the street: the art is about to pass under it.
  useEffect(() => {
    const [[rest]] = timeline.street.scale;
    const sync = (p: number) => zoomStarted.set(!reduced && p > rest);
    sync(progress.get());
    const stop = progress.on("change", sync);
    return () => {
      stop();
      zoomStarted.set(false);
    };
  }, [progress, reduced]);

  // Clouds drift, the bird hops, the family breathes. Off when motion is reduced.
  useAmbientLife(stage, progress, !reduced);
  // The ball rolls off the table, once.
  useBall(stage, progress, reduced);

  return (
    <div
      ref={track}
      className="relative landscape:h-[350lvh] portrait:h-[280lvh] motion-reduce:h-lvh!"
    >
      {/* The stage fills the screen at its tallest, so the art always reaches the bottom edge. */}
      <div ref={stage} className="sticky top-0 h-lvh overflow-hidden bg-linen">
        {/*
          The screen at its smallest (browser toolbars showing). Everything is
          laid out against this, so the art and the words fit in the worst case
          and nothing changes size when a toolbar slides away. It is also the
          `screen` container the roomy / tight / tiny / squat / narrow tiers
          read, and where HeroCopy leaves the height of the words (--copy-h).
        */}
        <div ref={screen} className="absolute inset-x-0 top-0 h-svh @container-[size]/screen">
          {/*
            The artboard: the art's own shape.
            Landscape covers the stage and is centred on it.
            Portrait hangs from the top and always fits the screen's height.
            Phones crop the sides; tablets and the strip below the smallest
            screen show the art's bleed instead.
          */}
          <div className="absolute left-1/2 -translate-x-1/2 landscape:top-[50lvh] landscape:h-[max(100lvh,56.25cqw)] landscape:w-[max(100cqw,177.78lvh)] landscape:-translate-y-1/2 portrait:top-0 portrait:h-[100cqh] portrait:w-[56.25cqh]">
            <div
              role="img"
              aria-label="A street at dusk. One house has a lit window. Inside, a family sits at the kitchen table, with Biscuit the dog asleep underneath."
              className="absolute inset-0"
            >
              <Plane name="street" progress={progress} spec={timeline.street}>
                {street}
              </Plane>
              <Plane name="table" progress={progress} spec={timeline.table} bleed="bg-paper">
                {table}
              </Plane>
              <Plane name="house" progress={progress} spec={timeline.house}>
                {house}
              </Plane>
              <Plane name="window" progress={progress} spec={timeline.window}>
                {windowFrame}
              </Plane>
            </div>

            {/*
              The final frame. hero.css sizes and places it for this screen, so
              the rings, box and note stay clear of the nav and of the words:
              smaller on short screens, and moved off the zoom's centre where
              there is no room on it (a phone held sideways).
            */}
            <div className="hero-final-frame absolute inset-0">
              <Rings progress={progress} />
              <BoxAndNote progress={progress}>{box}</BoxAndNote>
            </div>
          </div>

          <HeroCopy progress={progress} screen={screen} />
        </div>
      </div>
    </div>
  );
}
