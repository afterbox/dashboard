"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The hand-off to section 4: one last card, different from the rest. It is
 * handwritten, it doesn't drop into the box, and it lies across the edge of
 * the blush band that follows, so the two sections are joined by it.
 *
 * It arrives the way section 4 moves, not the way section 3 does: slowly,
 * settling like paper, with no bounce. Once.
 * Reduced motion: there from the start.
 */
export function HandOffNote() {
  const ref = useRef<HTMLParagraphElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const watcher = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setShown(true);
        watcher.disconnect();
      },
      { threshold: 0.9 },
    );
    watcher.observe(el);
    return () => watcher.disconnect();
  }, []);

  return (
    <div className="relative z-10 mx-auto flex w-full max-w-300 justify-center px-5 pt-10 md:px-6 beside:pt-0">
      <p
        ref={ref}
        className={`-mb-8 inline-flex items-center gap-3 rounded-sm border border-line bg-paper py-3 pr-6 pl-4 font-note text-note text-balance text-ink shadow-rest transition-[rotate,translate,opacity] duration-1400 ease-gift motion-reduce:translate-none! motion-reduce:-rotate-3! motion-reduce:opacity-100! ${
          shown ? "-rotate-3 opacity-100" : "translate-y-4 -rotate-8 opacity-0"
        }`}
      >
        <span aria-hidden className="size-2 shrink-0 rounded-pill border border-ink-muted bg-linen" />
        And the things only you can say…
      </p>
    </div>
  );
}
