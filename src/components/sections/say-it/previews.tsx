import { Fragment, type CSSProperties } from "react";
import { letter } from "./messages";

/**
 * What is inside each of Dad's three messages, as afterbox will show it. The
 * page shows the letter and the voice note being made (./SayStage.tsx); the
 * sheet shows each one finished (./Envelopes.tsx). Same pieces, both places.
 *
 * ./say-it.css moves them: the page says how far the ink (`--ink`) and the
 * recording (`--rec`) have got, on whatever holds them.
 */

/** The pen lifts at the end of a line: that many words' worth of nothing. */
const lift = 2;

let place = 0;
/** Every word of the letter, and where it comes in the writing. */
const written = letter.map((line) => {
  const words = line.split(" ").map((word) => ({ word, at: place++ }));
  place += lift;
  return words;
});

/** How much ink the whole letter takes. */
export const inkNeeded = place;

/** Dad's letter, in his hand. Inside something marked `say-letter`, it writes itself as `--ink` rises. */
export function LetterLines() {
  return (
    <div className="font-note text-note text-balance text-ink">
      {written.map((words, i) => (
        // His sign-off stands a little apart, as it would on paper.
        <p key={words[0].at} className={i === written.length - 1 ? "mt-4" : i === 1 ? "mt-2" : undefined}>
          {words.map(({ word, at }) => (
            <Fragment key={at}>
              <span className="say-word" style={{ "--i": at } as CSSProperties}>
                {word}
              </span>{" "}
            </Fragment>
          ))}
        </p>
      ))}
    </div>
  );
}

/** How loud each moment of the voice note is, 0 to 1. Made up, but the same every time. */
const bars = Array.from({ length: 44 }, (_, i) =>
  Number((0.22 + 0.78 * Math.abs(Math.sin(i * 1.7) * Math.sin(i * 0.45 + 1))).toFixed(2)),
);

/** How many bars a whole recording is. */
export const barsNeeded = bars.length;

const bar = { every: 6, width: 3, height: 48 } as const;

/**
 * PLACEHOLDER for the recorder's waveform. Inside something marked
 * `say-wave`, the bars rise one after another as `--rec` does.
 *
 * Moving parts, by name: `wave` breathes, very slightly, while nobody
 * scrolls (./say-life.ts); each `wave-bar` follows the recording.
 */
export function Wave() {
  return (
    <svg
      viewBox={`0 0 ${bars.length * bar.every} ${bar.height}`}
      aria-hidden
      focusable="false"
      className="block w-full fill-ink"
    >
      <g data-part="wave">
        {bars.map((loud, i) => (
          <rect
            key={i}
            data-part="wave-bar"
            x={i * bar.every + (bar.every - bar.width) / 2}
            y="0"
            width={bar.width}
            height={bar.height}
            rx={bar.width / 2}
            style={{ "--i": i, "--h": loud } as CSSProperties}
            className="say-bar"
          />
        ))}
      </g>
    </svg>
  );
}

/** PLACEHOLDER for a still from the video: a block, and the sign for "play". No face, no label. */
export function VideoStill() {
  return (
    <div className="relative grid aspect-video place-items-center rounded-lg bg-keepsake">
      <span className="grid size-14 place-items-center rounded-pill bg-paper">
        <svg viewBox="0 0 24 24" aria-hidden className="size-6 translate-x-0.5 fill-ink">
          <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" />
        </svg>
      </span>
    </div>
  );
}
