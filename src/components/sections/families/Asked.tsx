"use client";

import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";
import { SearchIcon } from "../kitchen-table/SearchBar";

// The typing, in milliseconds: the same as section 2 (docs/references.md, "Typing").
const perCharacter = 35;
/** After the last letter, before the answer starts to appear. */
const beforeAnswer = 500;

type Props = {
  /** What someone who has just lost a person might type. */
  question: string;
  /** afterbox's calm first step. */
  answer: string;
};

/**
 * One question and its answer. The question types itself, once, when it has
 * come well onto the screen; then the answer fades in beneath it. It never
 * clears or repeats: this is someone being answered, not a demo on a loop.
 *
 * The whole question is always laid out and only the typed part shows, so
 * the line breaks where it will break and nothing jumps (as in section 2).
 * Both are always in the page for screen readers; the typing itself is not read.
 *
 * Reduced motion: the question and the answer, still, from the first paint.
 */
export function Asked({ question, answer }: Props) {
  const pair = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const [typed, setTyped] = useState(0);
  const [answered, setAnswered] = useState(false);

  useEffect(() => {
    const el = pair.current;
    if (reduced || !el) return;

    let count = 0;
    let timer = 0;
    const type = () => {
      count += 1;
      setTyped(count);
      if (count < question.length) timer = window.setTimeout(type, perCharacter);
      else timer = window.setTimeout(() => setAnswered(true), beforeAnswer);
    };

    const watcher = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        watcher.disconnect();
        timer = window.setTimeout(type, beforeAnswer);
      },
      // Not until it is clear of the bottom fifth of the screen (and of the button pinned there on a phone).
      { threshold: 1, rootMargin: "0px 0px -20% 0px" },
    );
    watcher.observe(el);

    return () => {
      watcher.disconnect();
      window.clearTimeout(timer);
    };
  }, [question, reduced]);

  const shown = reduced ? question.length : typed;

  return (
    <div ref={pair} data-answered={answered || reduced ? "" : undefined}>
      <div className="flex items-start gap-3 rounded-lg border border-line bg-linen px-4 py-4 sm:px-5">
        <span className="flex h-7 items-center md:h-7.5">
          <SearchIcon />
        </span>
        <p className="min-w-0 flex-1 text-body-l-mobile text-ink md:text-body-l">
          <span className="sr-only motion-reduce:not-sr-only">{question}</span>
          <span aria-hidden className="motion-reduce:hidden">
            {question.slice(0, shown)}
            {/* The caret: no width of its own, so it never moves a letter. It goes once the answer comes. */}
            {!answered && (
              <span className="relative">
                <span className="families-caret absolute top-[0.12em] left-0 h-[1.1em] w-0.5 rounded-pill bg-ink" />
              </span>
            )}
            <span className="invisible">{question.slice(shown)}</span>
          </span>
        </p>
      </div>
      <p className="families-answer font-display mt-5 pl-4 text-display-s-mobile text-pretty text-ink sm:pl-5 md:text-display-s">
        {answer}
      </p>
    </div>
  );
}
