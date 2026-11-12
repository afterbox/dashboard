"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";
import { BeatCards, beats, Flyers, presses } from "./beats";
import { Tick } from "./cards";
import { useDrops } from "./drop";
import { useFillLife } from "./fill-life";
import { addItShown } from "./signals";
import { useBeats } from "./use-beats";
import "../box/box-scene.css";
import "./fill-it.css";

type Props = {
  /** The box scene's three layers, passed in already rendered so the art stays out of the script bundle. */
  rings: ReactNode;
  back: ReactNode;
  front: ReactNode;
};

/** True while the element is on screen. */
function useOnScreen(find: () => Element | null | undefined) {
  const [onScreen, setOnScreen] = useState(false);
  const finder = useRef(find);

  useEffect(() => {
    const el = finder.current();
    if (!el) return;
    const watcher = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting));
    watcher.observe(el);
    return () => watcher.disconnect();
  }, []);

  return onScreen;
}

/**
 * The box and the four beats. The box stays on screen while the beats scroll
 * past it in the ordinary way; nothing is pinned and nothing waits. Each
 * beat's cards arrive as it comes into view and drop into the box as it
 * reaches the middle (./use-beats.ts, ./drop.ts).
 *
 * Stacked (a phone or tablet held upright): the box is a strip along the
 * bottom of the screen. The beats come up from behind it and drop down into it.
 * Beside (held sideways, or a wide screen): the beats on the left, the box a
 * tall panel on the right, where section 2 left it.
 *
 * ./fill-it.css sizes the box for each.
 */
export function FillStage({ rings, back, front }: Props) {
  const layout = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  const steps = useBeats(layout, stage, presses);
  const flown = useDrops(layout, stage, steps, reduced);
  useFillLife(stage, !reduced);

  // Reduced motion: nothing flies, so a beat counts as in the box once it has been scrolled past.
  const landed = reduced ? steps.map((step, i) => (step === 3 ? beats[i].cards.length : 0)) : flown;
  const done = landed.map((count, i) => count === beats[i].cards.length);
  /** The beat whose line is under the box: the latest to land. */
  const saying = done.lastIndexOf(true);

  // One heartwood button in view: while "Add it" is showing, the nav's pill steps back.
  const firstOnScreen = useOnScreen(() => layout.current?.querySelector("[data-slot]"));
  const addIt = firstOnScreen && (reduced || steps[0] === 1 || steps[0] === 2);
  useEffect(() => {
    addItShown.set(addIt);
    return () => addItShown.set(false);
  }, [addIt]);

  const counts = {
    "--caught": done.filter(Boolean).length,
    "--items": landed.reduce((sum, count) => sum + count, 0),
  } as CSSProperties;

  return (
    <div
      ref={layout}
      className="fill-it mx-auto w-full max-w-300 px-5 md:px-6 beside:grid beside:grid-cols-12 beside:gap-x-6 beside:pt-12 lg:pt-24"
    >
      <div className="beside:col-span-5 beside:row-start-1">
        <div className="pt-10 pb-4 beside:flex beside:min-h-(--fi-h) beside:flex-col beside:justify-center beside:py-0">
          <h2
            id="fill-it-line"
            className="font-display text-display-m-mobile text-ink md:text-display-m low:text-display-m-mobile!"
          >
            {/* One block per sentence, so a sentence that has to wrap breaks evenly. */}
            <span className="block text-balance">Add what they&apos;ll need to find.</span>{" "}
            <span className="block text-balance">A little at a time.</span>
          </h2>
          <p className="mt-5 max-w-md text-body-l-mobile text-pretty text-ink-muted md:text-body-l low:mt-3">
            A few minutes, now and then, is enough. And afterbox notices the things you&apos;d forget.
          </p>
        </div>

        {/* The room under the last beat lets it reach the middle, and drop, before the box moves on. */}
        <ol className="pb-[34svh] beside:pb-[18svh]">
          {beats.map((beat, i) => (
            <li
              key={beat.id}
              data-beat={i}
              className="py-[11svh] beside:flex beside:min-h-[78svh] beside:flex-col beside:justify-center beside:py-8"
            >
              <p className="eyebrow text-ink-muted">{beat.label}</p>
              <h3 className="font-display mt-3 max-w-md text-display-s-mobile text-balance text-ink md:text-display-s low:text-display-s-mobile!">
                {beat.line}
              </h3>
              <BeatCards beat={beat} step={steps[i]} />
              {/* The line under the box is part of the moving scene; this is the same line for screen readers. */}
              <p className="sr-only">Added. {beat.added}</p>
            </li>
          ))}
        </ol>
      </div>

      <div
        ref={stage}
        style={counts}
        data-ears={!reduced && steps.some((step) => step === 1 || step === 2) ? "" : undefined}
        data-sitting={steps[beats.length - 1] === 3 ? "" : undefined}
        className="box-scene sticky bottom-0 z-10 -mx-5 bg-linen pb-[max(--spacing(3),env(safe-area-inset-bottom))] md:-mx-6 beside:top-(--fi-top) beside:bottom-auto beside:col-span-6 beside:col-start-7 beside:row-start-1 beside:mx-0 beside:flex beside:h-(--fi-h) beside:flex-col beside:justify-center beside:self-start beside:bg-transparent beside:pb-0"
      >
        {/* Stacked: the beats fade out as they pass behind the box, rather than being cut off. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-full h-8 bg-linear-to-t from-linen to-transparent beside:hidden"
        />

        <div
          role="img"
          aria-label="An open box with a gold ribbon, and Biscuit the dog lying beside it. A ring grows around the box each time something is added."
          className="@container-[size]/fill relative h-(--fi-art) beside:aspect-10/9 beside:h-auto beside:max-h-[calc(var(--fi-h)-var(--fi-says))]"
        >
          {/* The rings are cut off at the edge of the scene. Nothing else is: the cards fly in from outside it. */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="fill-board">{rings}</div>
          </div>
          <div className="fill-board">
            {back}
            <div data-flyers aria-hidden className="absolute inset-0">
              <Flyers />
            </div>
            {front}
            {/* Laid over the front of the box (see `board.box` in the art): the one glow, and where the cards land. */}
            <div
              data-part="glow"
              aria-hidden
              className="pointer-events-none absolute top-[54.29%] left-[47.5%] h-[32.86%] w-[40%] rounded-[7.5%/13%] opacity-0 shadow-glow"
            />
          </div>
        </div>

        {/* One line at a time, each taking the last one's place. Room for two lines on a phone. */}
        <div aria-hidden className="grid min-h-(--fi-says) shrink-0 place-items-center px-5 pt-1 beside:px-0">
          {beats.map((beat, i) => (
            <p
              key={beat.id}
              className={`flex max-w-sm gap-2 text-body text-ink transition-[opacity,translate] duration-480 ease-gift [grid-area:1/1] ${
                i === saying ? "opacity-100" : "translate-y-1.5 opacity-0"
              }`}
            >
              <Tick className="mt-0.75 text-sage" />
              <span className="text-balance">
                <span className="font-semibold text-sage">Added.</span> {beat.added}
              </span>
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
