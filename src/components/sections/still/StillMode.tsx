"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { stillShown } from "./signals";

/**
 * Wraps the sections written in Still mode (7 and 8), and tells the nav while
 * any of them is under it (see ./signals.ts). Nothing to see: it adds no box
 * of its own to the layout.
 */
export function StillMode({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // "Under the nav": on screen, and past the top fifth of it.
    const watcher = new IntersectionObserver(([entry]) => stillShown.set(entry.isIntersecting), {
      rootMargin: "-20% 0px -20% 0px",
    });
    watcher.observe(el);
    return () => {
      watcher.disconnect();
      stillShown.set(false);
    };
  }, []);

  return <div ref={ref}>{children}</div>;
}
