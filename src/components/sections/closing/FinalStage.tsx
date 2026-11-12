"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { motion, useMotionValue, useScroll, useTransform, type MotionValue } from "motion/react";
import { GiftButton } from "@/components/ui/GiftButton";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";
import { useAmbientLife } from "../hero/ambient/useAmbientLife";
import { BoxAndNote } from "../hero/BoxAndNote";
import { Plane } from "../hero/Plane";
import { Rings } from "../hero/Rings";
import { riseAt, timeline, type Span } from "../hero/timeline";
import { cameraAt, endsOn, opensOn, words } from "./camera";
import { closingCta } from "./signals";

type Props = {
  /** The hero's layers in their night versions, passed in already rendered so the art stays out of the script bundle. */
  street: ReactNode;
  house: ReactNode;
  windowFrame: ReactNode;
  table: ReactNode;
  box: ReactNode;
};

/**
 * Night, whatever the device's theme: the street outside, and the words laid
 * over it, take the Candlelight tokens. The kitchen inside keeps the theme the
 * page is in, so in Daylight it is the one bright room on a dark street.
 */
function Night({ children }: { children: ReactNode }) {
  return (
    <div data-theme="dark" className="absolute inset-0">
      {children}
    </div>
  );
}

// With reduced motion, CSS holds the last frame from the first paint, before any script runs.
const held = "motion-reduce:visible! motion-reduce:transform-none! motion-reduce:opacity-100!";
/** The kitchen, held as it is seen from the street: small, through the window. */
const [[, throughWindow]] = timeline.table.scale;
const heldSmall = "motion-reduce:visible! motion-reduce:transform-none! motion-reduce:scale-(--small)! motion-reduce:opacity-100!";

/** The words settle as the camera does, exactly as in the hero (../hero/HeroCopy.tsx). */
function useSettle(scrolled: MotionValue<number>, span: Span) {
  const opacity = useTransform(scrolled, (q) => riseAt(span, q));
  const scale = useTransform(opacity, (o) => 1 + (1 - o) * 0.06);
  const y = useTransform(opacity, (o) => (1 - o) * 12);
  return { opacity, scale, y };
}

/**
 * The closing scene: the hero's zoom, backwards. It opens on the box in its
 * rings, pulls back out past the family at the table and through the window,
 * and comes to rest on the house at night with every light on and Biscuit on
 * the doorstep. Then the words, on the road in front of the house.
 *
 * Everything the camera does is the hero's own: the same layers (in their
 * night versions), the same Plane, Rings and BoxAndNote, the same timeline.
 * ./camera.ts only says where on that timeline this scene is.
 *
 * Pinned for 150 screen-heights in landscape and 110 in portrait.
 * Reduced motion: no camera. The house at night, still, with the words.
 */
export function FinalStage({ street, house, windowFrame, table, box }: Props) {
  const track = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({ target: track, offset: ["start start", "end end"] });
  /** How far through this scene, 0 to 1. Reduced motion: at the end. */
  const scrolled = useMotionValue(0);
  /** The hero's camera position for that. */
  const progress = useMotionValue(opensOn);

  useEffect(() => {
    const show = (q: number) => {
      scrolled.set(reduced ? 1 : q);
      progress.set(reduced ? endsOn : cameraAt(q));
    };

    // Read straight from the page, so turning reduced motion on or off redraws at once (as in the hero).
    const el = track.current;
    if (el) {
      const { top, height } = el.getBoundingClientRect();
      const run = height - document.documentElement.clientHeight;
      show(run > 0 ? Math.min(1, Math.max(0, -top / run)) : 0);
    }

    return scrollYProgress.on("change", show);
  }, [reduced, scrollYProgress, scrolled, progress]);

  // The lights flicker, the stars come and go, Biscuit breathes. Off when motion is reduced.
  useAmbientLife(stage, progress, !reduced);

  const headline = useSettle(scrolled, words.headline);
  const cta = useSettle(scrolled, words.cta);
  const ctaVisibility = useTransform(cta.opacity, (o) => (o > 0 ? "visible" : "hidden"));

  // Tell the nav when the button is showing: on a phone held upright, for the whole scene.
  useEffect(() => {
    const [fadeStart, fadeEnd] = words.cta;
    const halfway = (fadeStart + fadeEnd) / 2;
    const portrait = window.matchMedia("(orientation: portrait)");
    let onScreen = false;
    const sync = () => closingCta.set(onScreen && (portrait.matches || scrolled.get() >= halfway));

    const observer = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      sync();
    });
    if (button.current) observer.observe(button.current);
    const stop = scrolled.on("change", sync);
    portrait.addEventListener("change", sync);

    return () => {
      observer.disconnect();
      stop();
      portrait.removeEventListener("change", sync);
      closingCta.set(false);
    };
  }, [scrolled]);

  return (
    <div ref={track} className="relative landscape:h-[250lvh] portrait:h-[210lvh] motion-reduce:h-lvh!">
      <div ref={stage} className="sticky top-0 h-lvh overflow-hidden bg-linen">
        {/*
          The same `screen` container as the hero, so the final frame is sized and placed by the same
          rules (../hero/hero.css). --copy-h there is the room the words take at the bottom of a phone
          held upright: here, while the box is showing, that is only the button.
        */}
        <div
          style={{ "--copy-h": "6.5rem" } as CSSProperties}
          className="absolute inset-x-0 top-0 h-svh @container-[size]/screen"
        >
          {/* The artboard: placed exactly as in the hero (../hero/HeroScene.tsx). */}
          <div className="absolute left-1/2 -translate-x-1/2 landscape:top-[50lvh] landscape:h-[max(100lvh,56.25cqw)] landscape:w-[max(100cqw,177.78lvh)] landscape:-translate-y-1/2 portrait:top-0 portrait:h-[100cqh] portrait:w-[56.25cqh]">
            <div
              role="img"
              aria-label="The same house, at night. Every light is on. Biscuit, old now, lies on the doorstep."
              className="absolute inset-0"
            >
              <Plane name="street" progress={progress} spec={timeline.street} held={held}>
                <Night>{street}</Night>
              </Plane>
              <div style={{ "--small": throughWindow } as CSSProperties} className="contents">
                <Plane name="table" progress={progress} spec={timeline.table} bleed="bg-paper" held={heldSmall}>
                  {table}
                </Plane>
              </div>
              <Plane name="house" progress={progress} spec={timeline.house} held={held}>
                <Night>{house}</Night>
              </Plane>
              <Plane name="window" progress={progress} spec={timeline.window} held={held}>
                <Night>{windowFrame}</Night>
              </Plane>
            </div>

            {/* Where it opens: the hero's final frame. Not part of the still frame when motion is reduced. */}
            <div className="hero-final-frame absolute inset-0 motion-reduce:hidden">
              <Rings progress={progress} />
              <BoxAndNote progress={progress}>{box}</BoxAndNote>
            </div>
          </div>

          {/*
            The words, on the road in front of the house. Behind them, a strip of the road's own
            colour: where the road on screen is taller than the words it can't be seen, and where it
            is shorter (a wide, low screen) the words still have flat ground to stand on.
            Landscape: one line across the bottom, the button at its end.
            Portrait: the headline above the button, which is pinned at the bottom for the whole scene.
          */}
          <div className="pointer-events-none absolute inset-x-0 top-0 flex h-dvh flex-col justify-end">
            <div className="relative">
              <motion.div
                aria-hidden
                data-theme="dark"
                style={{ opacity: headline.opacity }}
                className="absolute inset-0 bg-paper motion-reduce:opacity-100!"
              />
              <div className="relative mx-auto w-full max-w-300 px-5 pt-6 pb-[max(--spacing(5),env(safe-area-inset-bottom))] md:px-6 portrait:md:pb-[max(--spacing(8),env(safe-area-inset-bottom))] landscape:flex landscape:items-center landscape:justify-between landscape:gap-6 landscape:py-7 landscape:tight:py-3">
                <motion.h2
                  id="closing-line"
                  data-theme="dark"
                  style={headline}
                  className={`font-display origin-left text-display-l-mobile text-balance text-ink max-md:tight:text-display-s-mobile portrait:md:text-display-l landscape:md:text-display-m landscape:xl:text-display-l landscape:md:tight:text-display-s! ${held}`}
                >
                  Start building it for them.
                </motion.h2>
                <motion.div
                  ref={button}
                  style={{ ...cta, visibility: ctaVisibility }}
                  className={`pointer-events-auto mt-5 shrink-0 origin-left portrait:visible! portrait:transform-none! portrait:opacity-100! landscape:mt-0 ${held}`}
                >
                  <GiftButton size="hero" label="closing" className="w-full landscape:w-auto" />
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
