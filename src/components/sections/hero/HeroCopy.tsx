import { useEffect, useRef, type RefObject } from "react";
import { motion, useTransform, type MotionValue } from "motion/react";
import { GiftButton } from "@/components/ui/GiftButton";
import { heroCta } from "./signals";
import { riseAt, timeline, type Span } from "./timeline";

// With reduced motion, CSS holds the copy in place from the first paint.
const still = "motion-reduce:transform-none! motion-reduce:opacity-100!";

/**
 * How the words arrive. They are the last layer of the zoom, not a separate
 * reveal: each one comes into view a touch large and a little low, and settles
 * to rest as the camera does. Only the hero moves like this.
 */
function useSettle(progress: MotionValue<number>, span: Span) {
  const opacity = useTransform(progress, (p) => riseAt(span, p));
  const scale = useTransform(opacity, (o) => 1 + (1 - o) * 0.06);
  const y = useTransform(opacity, (o) => (1 - o) * 12);
  return { opacity, scale, y };
}

/**
 * The words, laid over the scene and never scaled by the camera.
 * Landscape: the left of the grid, level with the box.
 * Portrait: the lower third, with the button full width at the bottom.
 *
 * Sizes step down with the screen (the roomy / tight / tiny / squat / narrow
 * tiers in globals.css), always in the type tokens and never under 16px.
 *
 * The final frame makes room for the words, not the other way round:
 * - Portrait: this measures how tall the words are and leaves it on the
 *   `screen` container as --copy-h. hero.css fits the frame above that.
 * - A phone held sideways: the words keep to a fixed column (max-w-76, or
 *   max-w-80 from md) and hero.css fits the frame beside it. Change the column
 *   here and in hero.css together.
 */
type Props = {
  progress: MotionValue<number>;
  /** The `screen` container in HeroScene. */
  screen: RefObject<HTMLElement | null>;
};

export function HeroCopy({ progress, screen }: Props) {
  const headline = useSettle(progress, timeline.headline);
  const subline = useSettle(progress, timeline.subline);
  const cta = useSettle(progress, timeline.cta);
  // Until it has faded in, the button can't be clicked or tabbed to.
  const ctaVisibility = useTransform(cta.opacity, (o) => (o > 0 ? "visible" : "hidden"));
  const ctaRef = useRef<HTMLDivElement>(null);
  const wordsRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);

  // How much of the screen the words take, from the top of the headline to the bottom edge.
  useEffect(() => {
    const words = wordsRef.current;
    const top = headlineRef.current;
    const container = screen.current;
    if (!words || !top || !container) return;

    const measure = () =>
      container.style.setProperty("--copy-h", `${words.offsetHeight - top.offsetTop}px`);
    // The words re-wrap when the screen or the fonts change; the headline moves when they do.
    const observer = new ResizeObserver(measure);
    observer.observe(words);
    observer.observe(top);

    return () => {
      observer.disconnect();
      container.style.removeProperty("--copy-h");
    };
  }, [screen]);

  // Tell the nav when this button is showing, so its own pill steps back.
  useEffect(() => {
    const [fadeStart, fadeEnd] = timeline.cta;
    const halfway = (fadeStart + fadeEnd) / 2;
    let onScreen = false;
    const sync = () => heroCta.set(onScreen && progress.get() >= halfway);

    const observer = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      sync();
    });
    if (ctaRef.current) observer.observe(ctaRef.current);
    const stop = progress.on("change", sync);

    return () => {
      observer.disconnect();
      stop();
      heroCta.set(false);
    };
  }, [progress]);

  return (
    // As tall as the screen is right now, so the button follows the bottom edge as toolbars come and go.
    <div ref={wordsRef} className="pointer-events-none absolute inset-x-0 top-0 h-dvh">
      <div className="mx-auto flex h-full w-full max-w-300 flex-col justify-end px-5 pb-[max(--spacing(5),env(safe-area-inset-bottom))] md:px-6 portrait:md:pb-[max(--spacing(8),env(safe-area-inset-bottom))] landscape:justify-center landscape:pb-0 landscape:tight:pt-16 landscape:md:tight:pt-18">
        <motion.h1
          ref={headlineRef}
          id="hero-headline"
          style={headline}
          className={`font-display origin-left text-display-l-mobile text-balance text-ink max-md:roomy:text-display-xl-mobile max-md:tight:text-display-m-mobile max-md:narrow:text-display-m-mobile max-md:portrait:tiny:text-display-s-mobile! max-md:landscape:squat:text-display-s-mobile! portrait:md:text-display-xl landscape:md:max-xl:text-display-l landscape:xl:text-display-xl landscape:md:tight:text-display-l-mobile! ${still}`}
        >
          {/* One block per sentence, so a sentence that has to wrap on a phone breaks evenly. */}
          <span className="block">Build it for them.</span>{" "}
          <span className="block">Before they need it.</span>
        </motion.h1>
        <motion.p
          style={subline}
          className={`mt-4 max-w-md origin-left text-body-l-mobile text-pretty text-ink-muted max-md:tight:mt-3 max-md:tight:text-body max-md:tiny:mt-2 max-md:landscape:max-w-76 md:mt-6 md:text-body-l landscape:md:tight:mt-4 landscape:md:tight:max-w-80 landscape:md:tight:text-body-l-mobile! ${still}`}
        >
          Everything they&apos;ll need to find, and everything you want them to hear. Gathered as your
          life grows, and given to them when the time comes.
        </motion.p>
        <motion.div
          ref={ctaRef}
          style={{ ...cta, visibility: ctaVisibility }}
          className={`pointer-events-auto mt-6 origin-left max-md:tight:mt-5 max-md:tiny:mt-3 md:mt-8 landscape:md:tight:mt-6 ${still} motion-reduce:visible!`}
        >
          <GiftButton size="hero" className="w-full md:w-auto landscape:w-auto" />
        </motion.div>
      </div>
    </div>
  );
}
