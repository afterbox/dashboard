"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";
import { useFillLife } from "../fill-it/fill-life";
import { SlowFade } from "../kitchen-table/SlowFade";
import { marksPassed, useSteps } from "../sealed/use-steps";
import type { Age } from "./BiscuitAges";
import { CheckInChip, NudgeCard, sealedIn, years } from "./years";

type Props = {
  /** The sealed box and Biscuit at each age, passed in already rendered so the art stays out of the script bundle. */
  box: ReactNode;
  biscuit: Record<Age, ReactNode>;
};

/** Must match the wide layout in ./grows.css. */
const wide = "(width >= 64rem) and (height >= 40rem)";

/**
 * Wide: the scene is pinned, and the years pass with the scroll. Each mark is
 * where the top of the section is, as a share of the screen, when a year
 * begins: the first as the scene comes up, the rest a fifth of a screen apart.
 */
const pinnedYears = marksPassed([0.4, -0.04, -0.24, -0.44, -0.64]);

/** Upright: a year begins as its row comes three quarters of the way up the screen. */
function yearsReached(el: HTMLElement, screen: number) {
  if (window.matchMedia(wide).matches) return pinnedYears(el, screen);
  let reached = 0;
  el.querySelectorAll("[data-year]").forEach((row) => {
    if (row.getBoundingClientRect().top <= 0.76 * screen) reached += 1;
  });
  return reached;
}

/** A year takes this long before the next can begin, in milliseconds: the steady rhythm of the rings. */
const yearTakes = 520;

/** Which year this is, counted from 1, and the year Biscuit is next drawn older. ./grows.css reads both. */
const at = (k: number, until?: number) => ({ "--k": k, "--until": until }) as CSSProperties;

/** The year each Biscuit steps back in: when the next one is drawn. */
const until = (k: number) => {
  const next = years.findIndex((year, i) => i + 1 > k && year.biscuit);
  return next < 0 ? 99 : next + 1;
};

/**
 * Section 6: the years after the box is sealed. A ring for each, written with
 * its year; every other year afterbox has noticed something and asks about it,
 * and the years between are the check-in. Biscuit grows up along the way.
 *
 * See ./grows.css for the two compositions and how the scene is driven.
 * It ends with a line on its own, "And one day…", which section 7 answers.
 */
export function GrowsStage({ box, biscuit }: Props) {
  const track = useRef<HTMLDivElement>(null);
  const scene = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  const step = useSteps(track, yearsReached, yearTakes, !reduced);
  useFillLife(scene, !reduced);

  return (
    <>
      <div ref={track} className="grows">
        <div className="grows-pin">
          <div className="grows-frame mx-auto w-full max-w-300 px-5 md:px-6">
            <div className="grows-copy pt-16 lg:pt-10">
              <h2
                id="grows-line"
                className="font-display text-display-l-mobile text-ink md:text-display-l low:text-display-l-mobile!"
              >
                It grows with you.
              </h2>
              <p className="mt-4 max-w-md text-body-l-mobile text-pretty text-ink-muted md:text-body-l">
                A new home, a birthday, a new job. When life changes, afterbox asks gently, so what you&apos;ve
                left for them is never out of date.
              </p>
            </div>

            <div ref={scene} className="grows-scene mt-6 lg:mt-0" style={{ "--step": step } as CSSProperties}>
              <div aria-hidden className="grows-rings">
                {years.map(({ year }, i) => (
                  <span
                    key={year}
                    style={at(i + 1)}
                    className={`grows-ring ${i % 2 === 0 ? "border-heartwood" : "border-lantern"}`}
                  />
                ))}
              </div>
              <div aria-hidden className="grows-fade grows-fade-top" />
              <div aria-hidden className="grows-fade grows-fade-bottom" />

              <div className="grows-box">{box}</div>
              <div className="grows-biscuit grows-puppy" style={at(0, until(0))}>
                {biscuit.puppy}
              </div>
              <p className="grows-label grows-first font-display bg-linen text-display-s-mobile text-ink lg:text-body-l">
                {sealedIn}
              </p>

              <ol className="grows-years">
                {years.map((year, i) => (
                  <li key={year.year} data-year style={at(i + 1, until(i + 1))} className="grows-year">
                    <p className="grows-label font-display bg-linen text-display-s-mobile text-ink lg:text-body-l">
                      {year.year}
                    </p>
                    {year.kind === "nudge" ? (
                      <div className="grows-pop grows-card">
                        <NudgeCard {...year} />
                      </div>
                    ) : (
                      <div className="grows-pop grows-chip">
                        <CheckInChip {...year} />
                      </div>
                    )}
                    {year.biscuit && <div className="grows-biscuit">{biscuit[year.biscuit]}</div>}
                  </li>
                ))}
              </ol>
              <p className="sr-only">
                Biscuit the dog grows up alongside: a puppy in {sealedIn}, grey round the muzzle by 2034.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* The hand-off: the last ring has settled. One line, on its own. */}
      <SlowFade slower className="mx-auto w-full max-w-300 px-5 pt-10 pb-28 md:px-6 lg:pt-24 lg:pb-40">
        <p className="font-display text-center text-display-m-mobile text-ink md:text-display-m lg:text-left">
          And one day…
        </p>
      </SlowFade>
    </>
  );
}
