"use client";

import { useCallback, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";
import { Kind, paper, Tick } from "../fill-it/cards";
import { Envelopes } from "./Envelopes";
import { useIntoTheBox } from "./into-the-box";
import { clock, voiceLength } from "./messages";
import { barsNeeded, inkNeeded, LetterLines, Wave } from "./previews";
import { useSayLife } from "./say-life";
import { useArrived, useScrollShare } from "./use-scroll-share";
import "../box/box-scene.css";
import "./say-it.css";

type Props = {
  /** The art, passed in already rendered so it stays out of the script bundle. */
  mary: ReactNode;
  /** The box scene's three layers (../box/BoxSceneArt.tsx). */
  rings: ReactNode;
  back: ReactNode;
  front: ReactNode;
};

/** The box as section 3 left it: four rings, everything in. Nothing is added here, so nothing grows or bounces. */
const full = { "--caught": 4, "--items": 5 } as CSSProperties;

/**
 * Section 4, top to bottom. Nothing is pinned; each part plays as it is
 * scrolled into, and scrolling back up undoes it.
 *
 *   the words, and Mary     she grows up as the envelopes arrive
 *   the three envelopes     slide in and settle (./Envelopes.tsx)
 *   the letter              writes itself as it comes up the screen
 *   the voice note          records as it comes up the screen, then breathes
 *   the box                 the letters slide into it, and the lid begins to close
 *
 * Slow paper: `ease-gift` and a soft spring, never `ease-play`; no glow.
 * Reduced motion: the last frame of each, from the first paint.
 */
export function SayStage({ mary, rings, back, front }: Props) {
  const section = useRef<HTMLDivElement>(null);
  const row = useRef<HTMLOListElement>(null);
  const letter = useRef<HTMLDivElement>(null);
  const voice = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  const arrived = useArrived(row);

  // The letter: the ink follows the scroll.
  const write = useCallback((share: number) => {
    letter.current?.style.setProperty("--ink", (share * inkNeeded).toFixed(2));
  }, []);
  const unwrite = useCallback(() => {
    letter.current?.style.removeProperty("--ink");
  }, []);
  useScrollShare(letter, [0.86, 0.3], write, !reduced, unwrite);

  // The voice note: the bars and the counter follow the scroll.
  const [counted, setCounted] = useState(0);
  const record = useCallback((share: number) => {
    voice.current?.style.setProperty("--rec", (share * barsNeeded).toFixed(2));
    setCounted(Math.round(share * voiceLength));
  }, []);
  const unrecord = useCallback(() => {
    voice.current?.style.removeProperty("--rec");
  }, []);
  useScrollShare(voice, [0.86, 0.36], record, !reduced, unrecord);
  const seconds = reduced ? voiceLength : counted;
  const kept = seconds === voiceLength;

  useIntoTheBox(box, !reduced);
  useSayLife(section, !reduced);

  return (
    <div ref={section} className="say-it mx-auto w-full max-w-300 px-5 pt-20 md:px-6 md:pt-28 low:pt-16">
      <div className="md:grid md:grid-cols-12 md:items-end md:gap-x-6">
        <div className="md:col-span-7">
          <h2
            id="say-it-line"
            className="font-display text-display-l-mobile text-balance text-ink md:text-display-l low:text-display-l-mobile!"
          >
            Say what only you can say.
          </h2>
          <p className="font-display mt-4 max-w-md text-display-s-mobile text-balance text-ink md:text-display-s low:mt-3 low:text-display-s-mobile!">
            In your voice, to exactly the right person.
          </p>
          <p className="mt-5 max-w-md text-body-l-mobile text-pretty text-ink-muted md:text-body-l low:mt-3">
            A letter, a voice note, a video. Each one is sealed, and waits for the day it&apos;s meant for.
          </p>
        </div>

        <div
          role="img"
          aria-label="Mary by the door frame where her height is marked in pencil: a small child, then ten, then a teenager."
          data-grown={reduced || arrived ? "" : undefined}
          className="group/mary relative mt-10 aspect-4/3 max-h-[38svh] w-full overflow-hidden rounded-xl border border-line bg-paper md:col-span-4 md:col-start-9 md:mt-0 md:max-h-none"
        >
          {mary}
        </div>
      </div>

      <Envelopes row={row} arrived={arrived} />

      <div className="mt-20 grid gap-y-16 md:mt-28 md:grid-cols-12 md:gap-x-6 low:mt-16">
        <div className="md:col-span-6">
          <h3 className="font-display max-w-md text-display-s-mobile text-balance text-ink md:text-display-s">
            Write it once. It&apos;ll be there on the day.
          </h3>
          <div ref={letter} className={`say-letter mt-6 max-w-120 ${paper}`}>
            <Kind who="Mary">Letter</Kind>
            <div className="mt-4">
              <LetterLines />
            </div>
            <p className="mt-5 border-t border-line pt-3 text-small text-ink-muted">Sealed until her 18th birthday.</p>
          </div>
        </div>

        {/* Set lower than the letter on a wide screen: one, then the other. */}
        <div className="md:col-span-5 md:col-start-8 md:mt-44 low:mt-24">
          <h3 className="font-display max-w-md text-display-s-mobile text-balance text-ink md:text-display-s">
            Or just talk. They&apos;ll know it&apos;s you.
          </h3>
          <div ref={voice} className={`say-wave mt-6 max-w-120 ${paper}`}>
            <Kind who="Jo">Voice note</Kind>
            <p className="mt-2 font-note text-note text-balance text-ink">For when the house feels quiet</p>
            <div className="mt-5">
              <Wave />
            </div>
            <div className="mt-4 flex items-center justify-between gap-4 text-small text-ink-muted">
              {/* One line at a time, as under the box in section 3. */}
              <p className="grid">
                <span
                  aria-hidden={kept}
                  className={`inline-flex items-center gap-2 transition-opacity duration-480 ease-gift [grid-area:1/1] ${
                    kept ? "opacity-0" : "opacity-100"
                  }`}
                >
                  <span aria-hidden className="size-2 rounded-pill bg-heartwood" />
                  Recording
                </span>
                <span
                  aria-hidden={!kept}
                  className={`inline-flex items-center gap-1 text-sage transition-opacity duration-480 ease-gift [grid-area:1/1] ${
                    kept ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <Tick />
                  Kept for Jo
                </span>
              </p>
              <p className="tabular-nums">{clock(seconds)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-20 md:mt-32 low:mt-16">
        <div
          ref={box}
          role="img"
          aria-label="The open box with its gold ribbon. The three envelopes beside it slide in, one by one, and the lid begins to close."
          style={full}
          className="box-scene relative -mx-5 h-(--si-box) overflow-clip md:-mx-6"
        >
          <div className="say-board">{rings}</div>
          <div className="say-board">
            {back}
            {front}
          </div>
        </div>
        <p className="mx-auto max-w-md pt-8 pb-20 text-center font-display text-display-s-mobile text-balance text-ink md:pb-28 md:text-display-s low:pb-14">
          Kept with everything else they&apos;ll need, until the day they need it.
        </p>
      </div>
    </div>
  );
}
