"use client";

import { useRef, useState, type CSSProperties, type RefObject } from "react";
import { Kind } from "../fill-it/cards";
import { clock, messages, voiceLength, type Message } from "./messages";
import { LetterLines, VideoStill, Wave } from "./previews";

/** How each envelope lies once it has settled. Never quite straight: someone put them down by hand. */
const lies = ["-rotate-2", "rotate-1", "-rotate-1"] as const;
/** Wide screens: they don't line up, either. */
const drops = ["md:mt-8", "md:mt-0", "md:mt-14"] as const;

/** Milliseconds between one envelope setting off and the next. */
const apart = 380;

/** The finished message, as the person it is for will find it. */
function Preview({ message }: { message: Message }) {
  if (message.id === "letter") {
    return (
      <div className="say-letter" style={{ "--ink": 999 } as CSSProperties}>
        <LetterLines />
      </div>
    );
  }
  if (message.id === "voice") {
    return (
      <div className="say-wave" style={{ "--rec": 999 } as CSSProperties}>
        <Wave />
        <p className="mt-3 text-small text-ink-muted tabular-nums">{clock(voiceLength)}</p>
      </div>
    );
  }
  return (
    <>
      <VideoStill />
      <p className="mt-3 text-small text-ink-muted tabular-nums">1:48</p>
    </>
  );
}

type Props = {
  /** The row, for whoever needs to know where it is on the screen. */
  row: RefObject<HTMLOListElement | null>;
  /** The envelopes have come far enough up the screen to slide in. */
  arrived: boolean;
};

/**
 * Dad's three envelopes, addressed in his handwriting.
 *
 * They slide in from the left, one after another, and settle: slow paper, no
 * bounce (`ease-gift`). Scrolling back up takes them away again.
 *
 * A phone held upright: a stack to swipe through, one showing and the next
 * peeking in from the right. Wider: side by side.
 * Either way, pressing one opens what's inside: a sheet from the bottom of a
 * phone, a sheet of paper in the middle of a wider screen.
 *
 * Reduced motion: all three there from the first paint, side by side, or one
 * under another on a phone (nothing to swipe).
 */
export function Envelopes({ row, arrived }: Props) {
  const sheet = useRef<HTMLDialogElement>(null);
  const [showing, setShowing] = useState(0);
  const message = messages[showing];

  const open = (i: number) => {
    setShowing(i);
    sheet.current?.showModal();
  };
  const close = () => sheet.current?.close();

  return (
    <>
      <ol
        ref={row}
        className="-mx-5 mt-10 flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto px-5 py-4 [scrollbar-width:none] max-md:motion-reduce:flex-col max-md:motion-reduce:overflow-visible md:mx-0 md:mt-16 md:grid md:grid-cols-3 md:items-start md:gap-6 md:overflow-visible md:px-0 low:mt-10 [&::-webkit-scrollbar]:hidden"
      >
        {messages.map(({ id, address, kind }, i) => (
          <li
            key={id}
            style={{ transitionDelay: `${i * apart}ms` }}
            className={`w-[84%] max-w-90 shrink-0 snap-start transition-[translate,rotate,opacity] duration-1400 ease-gift motion-reduce:translate-none! motion-reduce:rotate-none! motion-reduce:opacity-100! max-md:motion-reduce:w-full md:w-auto md:max-w-none ${drops[i]} ${
              arrived ? "" : "-translate-x-16 -rotate-4 opacity-0"
            }`}
          >
            <button
              type="button"
              onClick={() => open(i)}
              aria-haspopup="dialog"
              className="group block w-full cursor-pointer rounded-md text-left"
            >
              {/* The front of the envelope: a stamp, a postmark, and who it's for. Blocks, until the art arrives. */}
              <span
                className={`relative flex min-h-44 flex-col justify-end rounded-md border border-line bg-paper p-6 shadow-rest transition-shadow duration-480 ease-gift group-hover:shadow-lift md:min-h-52 low:min-h-40 ${lies[i]}`}
              >
                <span aria-hidden className="absolute top-5 right-5 h-11 w-9 rounded-sm bg-lantern" />
                <span aria-hidden className="absolute top-7 right-11 size-10 rounded-pill border border-ink-muted" />
                <span className="max-w-[22ch] font-note text-note text-balance text-ink">{address}</span>
              </span>
              <span className="mt-4 flex items-baseline justify-between gap-4 px-1">
                <span className="text-small text-ink-muted">{kind}</span>
                <span className="text-label text-ink underline decoration-ink-muted decoration-1 underline-offset-4 group-hover:decoration-ink">
                  Open
                </span>
              </span>
            </button>
          </li>
        ))}
      </ol>

      {/* What's inside. Tapping outside it closes it. */}
      <dialog
        ref={sheet}
        aria-labelledby="say-it-sheet"
        onClick={(event) => event.target === event.currentTarget && close()}
        className="fixed inset-x-0 top-auto bottom-0 m-0 max-h-[88svh] w-full max-w-none translate-y-full overflow-y-auto rounded-t-xl border border-b-0 border-line bg-paper text-ink opacity-0 shadow-rest transition-[translate,opacity,display,overlay] transition-discrete duration-480 ease-gift backdrop:bg-linen/80 backdrop:opacity-0 backdrop:transition-[opacity,display,overlay] backdrop:transition-discrete backdrop:duration-480 open:translate-y-0 open:opacity-100 open:backdrop:opacity-100 md:inset-0 md:m-auto md:h-fit md:max-w-120 md:translate-y-4 md:rounded-xl md:border-b md:open:translate-y-0 starting:open:translate-y-full starting:open:opacity-0 starting:open:backdrop:opacity-0 md:starting:open:translate-y-4"
      >
        <div className="px-5 pt-3 pb-[max(--spacing(5),env(safe-area-inset-bottom))] md:p-8">
          <div aria-hidden className="mx-auto h-1 w-10 rounded-pill bg-line md:hidden" />
          <div className="mt-5 md:mt-0">
            <Kind who={message.who}>{message.kind}</Kind>
          </div>
          <h3 id="say-it-sheet" className="mt-2 font-note text-note text-balance text-ink">
            {message.address}
          </h3>
          <div className="mt-5 rounded-lg bg-linen p-5">
            <Preview message={message} />
          </div>
          <p className="mt-4 text-small text-ink-muted">{message.keeps}</p>
          <button
            type="button"
            onClick={close}
            className="mt-5 inline-flex h-12 cursor-pointer items-center rounded-pill border border-ink-muted px-6 text-label text-ink"
          >
            Close
          </button>
        </div>
      </dialog>
    </>
  );
}
