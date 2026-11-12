"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type Props = {
  /** The scene, drawn twice, passed in already rendered so the art stays out of the script bundle. */
  landscape: ReactNode;
  portrait: ReactNode;
  className?: string;
};

/**
 * The opening: the room, the message Mary receives, the lid lifting and her
 * letter rising out. It plays once, when most of the panel is on screen, and
 * stays as it ends (see ./opening.css).
 */
export function OpeningScene({ landscape, portrait, className = "" }: Props) {
  const panel = useRef<HTMLDivElement>(null);
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    const el = panel.current;
    if (!el) return;
    const watcher = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setOpened(true);
        watcher.disconnect();
      },
      { threshold: 0.55 },
    );
    watcher.observe(el);
    return () => watcher.disconnect();
  }, []);

  return (
    <div
      ref={panel}
      data-opened={opened ? "" : undefined}
      className={`opening-scene @container-[size]/opening relative overflow-clip rounded-xl border border-line bg-paper ${className}`}
    >
      <div
        role="img"
        aria-label="Years later. Mary, grown up, stands by the box in the hall. Biscuit, old now, rests by the door. The lid lifts, slowly, and her letter rises out."
        className="absolute inset-x-4 top-0 bottom-0 sm:inset-x-6"
      >
        {portrait}
        {landscape}
      </div>

      {/* What Mary receives. afterbox's words, so not handwritten. */}
      <div className="opening-message absolute inset-x-4 top-4 rounded-lg border border-line bg-linen p-4 shadow-rest sm:inset-x-auto sm:top-6 sm:right-6 sm:w-72">
        <p className="text-small text-ink-muted">From afterbox, for Mary</p>
        <p className="mt-1.5 text-body text-pretty text-ink">
          Mary, your dad left something for you. It&apos;s here whenever you&apos;re ready.
        </p>
      </div>
    </div>
  );
}
