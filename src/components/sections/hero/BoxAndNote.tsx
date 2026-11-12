import type { ReactNode } from "react";
import { motion, useTransform, type MotionValue } from "motion/react";
import { Plane } from "./Plane";
import { fadeAt, timeline } from "./timeline";

type Props = {
  progress: MotionValue<number>;
  /** The box illustration. */
  children: ReactNode;
};

/**
 * Arrival: the box settles, then its note fades in.
 * The note is the one handwritten moment on this screen. It is live text, not
 * part of the illustration, and hangs from the bottom edge of the box.
 *
 * The note is words, so it stays much the same size while the box shrinks with
 * the screen. Portrait: it is placed by its top edge, part-way down the box, so
 * on a phone it hangs lower rather than covering the box. Landscape: it is
 * placed by its middle, so on a short screen it rides up over the box rather
 * than down onto the ring labels beneath it.
 */
export function BoxAndNote({ progress, children }: Props) {
  const noteOpacity = useTransform(progress, (p) => fadeAt(timeline.note, p));

  return (
    <Plane name="box" progress={progress} spec={timeline.box} inFinalFrame>
      {/*
        The box and its note shrink together by `--s`, the final frame's size on this screen.
        The note shrinks a little more, by `--n`, where it would be wider than the space (hero.css).
      */}
      <div className="absolute inset-0 scale-(--s) landscape:origin-[68%_50%] portrait:origin-[50%_36%]">
        {children}
        <motion.p
          style={{ opacity: noteOpacity }}
          className="absolute flex -translate-x-1/2 -translate-y-1/2 scale-(--n) -rotate-3 items-center gap-3 rounded-sm border border-line bg-paper py-2 pr-5 pl-3 font-note text-note whitespace-nowrap text-ink shadow-rest motion-reduce:opacity-100! landscape:top-[65.3%] landscape:left-[69.9%] max-md:landscape:tight:-translate-y-[39%] portrait:top-[41.5%] portrait:left-[54.4%] portrait:origin-top portrait:translate-y-0 portrait:max-md:top-[39.5%] portrait:max-md:left-[51%] portrait:max-md:leading-7"
        >
          <span aria-hidden className="size-2 shrink-0 rounded-pill border border-ink-muted bg-linen" />
          {/*
            Phones break the first sentence too, so the note stays narrow: inside the side margins
            upright, beside the words sideways. Sideways it hangs a little lower, so the extra line
            doesn't cover more of the box.
          */}
          <span>
            <span className="block">
              Mary, everything you&apos;ll need <br className="hidden max-md:landscape:tight:block portrait:max-md:block" />
              is in here.
            </span>
            <span className="block">You won&apos;t have to guess.</span>
            <span className="block">Love, Dad x</span>
          </span>
        </motion.p>
      </div>
    </Plane>
  );
}
