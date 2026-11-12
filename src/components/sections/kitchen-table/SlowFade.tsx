"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type Props = {
  /** Slower still, for the turn. */
  slower?: boolean;
  className?: string;
  children: ReactNode;
};

/**
 * A slow fade, once, when most of it has come on screen. Opacity only: it
 * doesn't rise or slide. With typing, this is all that moves in section 2.
 * Reduced motion: there from the start.
 */
export function SlowFade({ slower = false, className = "", children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
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
      { threshold: 0.6 },
    );
    watcher.observe(el);
    return () => watcher.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-opacity ease-gift motion-reduce:opacity-100! ${slower ? "duration-1400" : "duration-1000"} ${
        shown ? "opacity-100" : "opacity-0"
      } ${className}`}
    >
      {children}
    </div>
  );
}
