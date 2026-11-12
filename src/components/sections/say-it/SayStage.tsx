"use client";

import { useCallback, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";
import { Kind, paper, Tick } from "../fill-it/cards";
import { useIntoTheBox } from "./into-the-box";
import { clock, videoLength, voiceLength } from "./messages";
import { barsNeeded, inkNeeded, LetterLines, VideoStill, Wave } from "./previews";
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

/** Where a card's top edge is, down the screen, when its message starts being made and when it is done. */
const making = [0.86, 0.36] as const;
const writing = [0.86, 0.3] as const;

const write = (share: number, el: HTMLElement) => el.style.setProperty("--ink", (share * inkNeeded).toFixed(2));
const unwrite = (el: HTMLElement) => el.style.removeProperty("--ink");

/**
 * A recording that follows the scroll: as its card comes up the screen, a
 * number on the card (`name`) rises from 0 to `whole`, and the counter runs
 * from nothing to `length` seconds. ./say-it.css draws the number.
 * Reduced motion: already recorded.
 */
function useRecording(
  card: RefObject<HTMLElement | null>,
  name: string,
  whole: number,
  length: number,
  reduced: boolean,
) {
  const [counted, setCounted] = useState(0);
  const show = useCallback(
    (share: number, el: HTMLElement) => {
      el.style.setProperty(name, (share * whole).toFixed(2));
      setCounted(Math.round(share * length));
    },
    [name, whole, length],
  );
  const clear = useCallback((el: HTMLElement) => el.style.removeProperty(name), [name]);
  useScrollShare(card, making, show, !reduced, clear);

  return reduced ? length : counted;
}

type TakeProps = {
  /** How far the recording has got, and how long it runs, in seconds. */
  seconds: number;
  length: number;
  /** What it says once it is done. */
  kept: string;
};

/** Under a recording: that it is recording, then that it is kept; and the counter. */
function Take({ seconds, length, kept }: TakeProps) {
  const done = seconds === length;
  return (
    <div className="mt-4 flex items-center justify-between gap-4 text-small text-ink-muted">
      {/* One line at a time, as under the box in section 3. */}
      <p className="grid">
        <span
          aria-hidden={done}
          className={`inline-flex items-center gap-2 transition-opacity duration-480 ease-gift [grid-area:1/1] ${
            done ? "opacity-0" : "opacity-100"
          }`}
        >
          <span aria-hidden className="size-2 rounded-pill bg-heartwood" />
          Recording
        </span>
        <span
          aria-hidden={!done}
          className={`inline-flex items-center gap-1 text-sage transition-opacity duration-480 ease-gift [grid-area:1/1] ${
            done ? "opacity-100" : "opacity-0"
          }`}
        >
          <Tick />
          {kept}
        </span>
      </p>
      <p className="tabular-nums">{clock(seconds)}</p>
    </div>
  );
}

/** Who a message is for, and when, in Dad's hand: what he would write on the envelope. */
function Address({ children }: { children: ReactNode }) {
  return <p className="mt-2 font-note text-note text-balance text-ink">{children}</p>;
}

const heading = "font-display max-w-md text-display-s-mobile text-balance text-ink md:text-display-s";

/**
 * Section 4, top to bottom. Nothing is pinned and nothing needs pressing;
 * each part plays as it is scrolled into, and scrolling back up undoes it.
 *
 *   the words, and Mary   she grows up, once, as she comes into view
 *   the letter            writes itself as it comes up the screen
 *   the voice note        records as it comes up the screen, then breathes
 *   the video             records as it comes up the screen
 *   the box               three letters slide into it, and the lid begins to close
 *
 * Each of the three is addressed in Dad's handwriting, as on an envelope.
 * Wide screens: they step down the page, left, right, left. A phone: one
 * under another.
 *
 * Slow paper: `ease-gift` and a soft spring, never `ease-play`; no glow.
 * Reduced motion: the last frame of each, from the first paint.
 */
export function SayStage({ mary, rings, back, front }: Props) {
  const section = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const letter = useRef<HTMLDivElement>(null);
  const voice = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  // Mary grows up once most of her panel is on screen.
  const grown = useArrived(panel, 0.3);

  // The letter: the ink follows the scroll. It has more to get through than a recording, so it is given a little longer.
  useScrollShare(letter, writing, write, !reduced, unwrite);

  const spoken = useRecording(voice, "--rec", barsNeeded, voiceLength, reduced);
  const filmed = useRecording(video, "--take", 1, videoLength, reduced);

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
          ref={panel}
          role="img"
          aria-label="Mary by the door frame where her height is marked in pencil: a small child, then ten, then a teenager."
          data-grown={reduced || grown ? "" : undefined}
          className="group/mary relative mt-10 aspect-4/3 max-h-[38svh] w-full overflow-hidden rounded-xl border border-line bg-paper md:col-span-4 md:col-start-9 md:mt-0 md:max-h-none"
        >
          {mary}
        </div>
      </div>

      <div className="mt-20 grid gap-y-16 md:mt-28 md:grid-cols-12 md:gap-x-6 low:mt-16">
        <div className="md:col-span-6">
          <h3 className={heading}>Write it once. It&apos;ll be there on the day.</h3>
          <div ref={letter} className={`say-letter mt-6 max-w-120 ${paper}`}>
            <Kind>Letter</Kind>
            <Address>For Mary, on her 18th birthday</Address>
            <div className="mt-4 border-t border-line pt-4">
              <LetterLines />
            </div>
            <p className="mt-5 border-t border-line pt-3 text-small text-ink-muted">
              Sealed until then. Only Mary will open it.
            </p>
          </div>
        </div>

        {/* Set lower than the letter on a wide screen: one, then the next. */}
        <div className="md:col-span-5 md:col-start-8 md:mt-44 low:mt-24">
          <h3 className={heading}>Or just talk. They&apos;ll know it&apos;s you.</h3>
          <div ref={voice} className={`say-wave mt-6 max-w-120 ${paper}`}>
            <Kind>Voice note</Kind>
            <Address>For Jo, for when the house feels quiet</Address>
            <div className="mt-5">
              <Wave />
            </div>
            <Take seconds={spoken} length={voiceLength} kept="Kept for Jo" />
          </div>
        </div>

        <div className="md:col-span-5 md:col-start-2">
          <h3 className={heading}>Or let them see you say it.</h3>
          <div ref={video} className={`say-film mt-6 max-w-120 ${paper}`}>
            <Kind>Video</Kind>
            <Address>For Mum</Address>
            <div className="mt-4">
              <VideoStill ready={filmed === videoLength} />
            </div>
            <Take seconds={filmed} length={videoLength} kept="Kept for Mum" />
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
