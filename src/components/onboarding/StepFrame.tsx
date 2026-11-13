"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { StepSlide } from "./StepSlide";

type Props = {
  /** The one question this screen asks. */
  title: ReactNode;
  /** A line under it, where the story has one. */
  lede?: ReactNode;
  children?: ReactNode;
};

/**
 * One onboarding screen: its question, then whatever answers it. Each new one
 * moves focus to its heading, so a screen reader starts at the question and a
 * keyboard starts just above the first field.
 */
export function StepFrame({ title, lede, children }: Props) {
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, []);

  return (
    <StepSlide>
      <div className="flex flex-1 flex-col pt-2">
        <h1
          ref={heading}
          tabIndex={-1}
          className="font-display text-display-m-mobile text-balance text-ink outline-none md:text-display-m"
        >
          {title}
        </h1>
        {lede && <p className="mt-3 text-body-l-mobile text-pretty text-ink-muted md:text-body-l">{lede}</p>}
        <div className="mt-6 flex flex-1 flex-col">{children}</div>
      </div>
    </StepSlide>
  );
}

/**
 * Where a screen's buttons sit. On a phone: pinned to the bottom edge, full
 * width, clear of the home indicator, and still there when the screen is
 * longer than the phone. From a tablet up: under the question, in the column.
 */
export function StepActions({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 z-10 -mx-5 mt-auto bg-linen px-5 pt-6 pb-2 short:pt-3 md:static md:mx-0 md:mt-0 md:px-0 md:pt-10 md:pb-6">
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
