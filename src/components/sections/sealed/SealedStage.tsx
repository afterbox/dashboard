"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";
import { promises } from "@/lib/trust-lines";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";
import { useArrived } from "../say-it/use-scroll-share";
import { holders, KeyPiece } from "./KeyArt";
import { marksPassed, useSteps } from "./use-steps";

type Props = {
  /** The box, passed in already rendered so the art stays out of the script bundle. */
  box: ReactNode;
};

/** Where the top of the key scene is, down the screen, when the key appears, splits, and is shared out. */
const keyPlays = marksPassed([0.82, 0.64, 0.48]);
/** Each of those holds this long before the next, in milliseconds: every move finishes before the next starts. */
const keyHolds = 420;

/** Which one this is, counted from 0. ./sealed.css reads it. */
const nth = (i: number) => ({ "--i": i }) as CSSProperties;

/**
 * Section 5, top to bottom. Nothing is pinned. Each part plays as it is
 * scrolled into, in its own short time, and scrolling back up undoes it.
 *
 *   the box        section 4 left the lid part-closed. It comes down the rest
 *                  of the way, the box takes the weight (the click), and the
 *                  ribbon ties itself.
 *   the key        appears whole, splits in three, and a piece goes to each holder
 *   the promises   three lines, each settling into place under its rule
 *   the box again  sealed and still, the next ring starts to grow: time passing
 *
 * Stacked (a phone or tablet held upright): the box is a strip across the top
 * of the band, the size and place it had at the end of section 4.
 * Beside (held sideways, or a wide screen): the box is a tall panel on the
 * left that stays while the words pass, so it is still there, sealed, when
 * the ring starts to grow.
 *
 * Precise and mechanical: `ease-state` only. Nothing bounces, nothing glows.
 * Reduced motion: the last frame of each, from the first paint.
 */
export function SealedStage({ box }: Props) {
  const board = useRef<HTMLDivElement>(null);
  const key = useRef<HTMLDivElement>(null);
  const lines = useRef<HTMLUListElement>(null);
  const end = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  const sealed = useArrived(board, 0.45) || reduced;
  const keyStep = useSteps(key, keyPlays, keyHolds, !reduced);
  const settled = useArrived(lines, 0.25) || reduced;
  const growing = useArrived(end, 0.3) || reduced;

  return (
    <div className="sealed mx-auto w-full max-w-300 px-5 pt-12 pb-20 md:px-6 beside:grid beside:grid-cols-12 beside:gap-x-6 beside:pb-16 lg:pt-20 lg:pb-24">
      <div className="beside:sticky beside:top-(--se-top) beside:col-span-5 beside:row-start-1 beside:h-(--se-h) beside:self-start">
        <div
          role="img"
          aria-label="The box, closed. Its lid comes down the last of the way and the gold ribbon ties itself in a bow. A new ring begins to grow around it."
          data-sealed={sealed ? "" : undefined}
          data-growing={growing ? "" : undefined}
          className="sealed-scene @container-[size]/sealed relative -mx-5 h-(--se-box) overflow-clip md:-mx-6 beside:mx-0 beside:h-full beside:overflow-visible"
        >
          <div ref={board} className="sealed-board">
            {box}
          </div>
        </div>
      </div>

      <div className="beside:col-span-6 beside:col-start-7 beside:row-start-1">
        <div className="pt-10 beside:flex beside:min-h-(--se-h) beside:flex-col beside:justify-center beside:pt-0">
          <h2
            id="sealed-line"
            className="font-display text-display-l-mobile text-linen md:text-display-l low:text-display-l-mobile!"
          >
            {/* One block per sentence: the second lands on its own line. */}
            <span className="block">Sealed.</span> <span className="block">Even from us.</span>
          </h2>
          <p className="mt-5 max-w-md text-body-l-mobile text-pretty text-linen/80 md:text-body-l low:mt-3">
            What you put in for them stays private. Nobody can read it while you&apos;re alive. Not us, not
            anyone.
          </p>
        </div>

        <div className="pt-20 beside:flex beside:min-h-[86svh] beside:flex-col beside:justify-center beside:py-10">
          <h3 className="font-display max-w-md text-display-s-mobile text-balance text-linen md:text-display-s low:text-display-s-mobile!">
            The key is split in three.
          </h3>
          <p className="mt-3 max-w-md text-body-l-mobile text-pretty text-linen/80 md:text-body-l">
            One piece each. It only opens when all three come together, for the people you named.
          </p>

          <div ref={key} data-key={reduced ? 3 : keyStep} className="sealed-key mt-6">
            <ul className="sealed-holders">
              {holders.map((holder, i) => (
                <li key={holder.name} style={nth(i)} className="sealed-holder">
                  <span className="sealed-slot rounded-md border border-dashed border-linen/40">
                    {/* The holder closing on its piece: a solid edge over the dashed one. */}
                    <span aria-hidden className="sealed-lock absolute -inset-px rounded-md border border-linen" />
                    <span aria-hidden className="sealed-piece">
                      <KeyPiece part={i as 0 | 1 | 2} />
                    </span>
                  </span>
                  <p className="@min-[30rem]/key:mt-4">
                    <span className="block text-body font-medium text-linen">{holder.name}</span>
                    <span className="mt-1 block text-small text-pretty text-linen/80">{holder.note}</span>
                  </p>
                </li>
              ))}
            </ul>
            <p className="sealed-alone font-display mt-8 text-display-s-mobile text-linen md:text-display-s">
              None can open it alone.
            </p>
          </div>
        </div>

        <div className="pt-24 beside:flex beside:min-h-[80svh] beside:flex-col beside:justify-center beside:py-10">
          <h3 className="eyebrow text-linen/80">Our promises</h3>
          <ul
            ref={lines}
            data-settled={settled ? "" : undefined}
            className="group/promises mt-5 border-b border-linen/25"
          >
            {promises.map((line, i) => (
              <li key={line} className="relative">
                {/* The rule is drawn from the left; then the line settles under it. */}
                <span
                  aria-hidden
                  style={{ transitionDelay: settled ? `${i * 140}ms` : undefined }}
                  className="absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-linen/25 transition-[scale] duration-600 ease-state group-data-settled/promises:scale-x-100 motion-reduce:scale-x-100!"
                />
                <p
                  style={{ transitionDelay: settled ? `${160 + i * 140}ms` : undefined }}
                  className="font-display -translate-x-3 py-5 text-display-s-mobile text-balance text-linen opacity-0 transition-[translate,opacity] duration-480 ease-state group-data-settled/promises:translate-x-0 group-data-settled/promises:opacity-100 motion-reduce:translate-none! motion-reduce:opacity-100! md:py-6 md:text-display-s low:text-display-s-mobile!"
                >
                  {line}
                </p>
              </li>
            ))}
          </ul>
          {/* Past here the box has been sealed a while: its next ring starts to grow. */}
          <div ref={end} aria-hidden className="h-px" />
        </div>
      </div>
    </div>
  );
}
