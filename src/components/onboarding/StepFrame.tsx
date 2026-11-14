"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { StepSlide } from "./StepSlide";

type Props = {
  /** The one question this screen asks. */
  title: ReactNode;
  /** A line under it, where the story has one. */
  lede?: ReactNode;
  /** An id for the question, for a field that is described by it. */
  titleId?: string;
  /**
   * Where focus goes when the screen arrives. `heading` (the usual): a screen
   * reader starts at the question, and a keyboard just above the first field.
   * `none`: the screen puts focus somewhere itself, such as straight in its one field.
   */
  focus?: "heading" | "none";
  children?: ReactNode;
};

/**
 * One onboarding screen: its question, then whatever answers it. Each new one
 * moves focus to its heading, unless the screen takes focus itself.
 */
export function StepFrame({ title, lede, titleId, focus = "heading", children }: Props) {
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (focus === "heading") heading.current?.focus({ preventScroll: true });
    // Only as the screen arrives.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <StepSlide>
      <div className="flex flex-1 flex-col pt-2">
        <h1
          ref={heading}
          id={titleId}
          tabIndex={-1}
          className="font-display text-display-m-mobile text-balance text-ink outline-none max-md:short:text-display-s-mobile md:text-display-m"
        >
          {title}
        </h1>
        {lede && <p className="mt-2 text-body-l-mobile text-pretty text-ink-muted md:mt-3 md:text-body-l">{lede}</p>}
        <div className="mt-6 flex flex-1 flex-col short:mt-3">{children}</div>
      </div>
    </StepSlide>
  );
}

/**
 * Where a screen's buttons sit. On a phone: full width at the bottom of the
 * screen, clear of the home indicator. They are part of the page, not laid
 * over it: if a screen ever grows longer than the phone (a long letter), the
 * button follows what was written, and nothing is ever covered. From a tablet
 * up: under the question, in the column.
 */
export function StepActions({ children }: { children: ReactNode }) {
  return (
    <div className="mt-auto pt-4 pb-2 short:pt-3 md:mt-0 md:pt-10 md:pb-6">
      <div className="space-y-1">{children}</div>
    </div>
  );
}

/** While what they've made so far loads, or if it couldn't be loaded. */
export function StepWaiting({ failed, onRetry }: { failed: boolean; onRetry: () => void }) {
  if (!failed) return <div className="flex-1" aria-busy="true" />;
  return (
    <div className="flex flex-1 flex-col pt-2">
      <p role="alert" className="text-body text-ink">
        We couldn&apos;t reach afterbox. Nothing you made is lost. Check your connection and try again.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-6 inline-flex min-h-12 items-center justify-center self-start rounded-pill border border-ink-muted px-6 text-label text-ink"
      >
        Try again
      </button>
    </div>
  );
}
