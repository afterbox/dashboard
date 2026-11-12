"use client";

import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";

/** What she types into the search bar, one after another. */
const questions = [
  "Did he have life insurance?",
  "Which pension was from his first job?",
  "Where did he keep the keys to his crypto wallet?",
  "What did he want for his funeral?",
] as const;

// The typing, in milliseconds (docs/references.md, "Typing").
const perCharacter = 35;
const pauseOnLine = 1200;
const clearPerCharacter = 15;
/** A breath before the next question starts. */
const beforeNext = 400;

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-6 shrink-0 fill-none stroke-current text-ink-muted">
      <circle cx="11" cy="11" r="6.25" strokeWidth="1.5" />
      <path d="M15.75 15.75L20 20" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/**
 * The section's motion signature: questions type and clear in a search bar,
 * one after another. Only section 2 and section 8 type.
 *
 * The whole question is always laid out and only the typed part shows, so the
 * line breaks where it will break and the words never jump as they arrive.
 * The bar keeps room for two lines; wide screens need one.
 *
 * It types only while it is on screen and the tab is showing.
 *
 * Reduced motion: no typing. The four questions are shown as a still list.
 * That list is always in the page for screen readers; the typing is not read.
 */
export function SearchBar() {
  const bar = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const [{ line, typed }, setView] = useState({ line: 0, typed: 0 });

  useEffect(() => {
    const el = bar.current;
    if (reduced || !el) return;

    let line = 0;
    let typed = 0;
    let clearing = false;
    let timer = 0;
    let awake = false;
    let onScreen = false;

    const step = () => {
      const length = questions[line].length;
      let wait: number;
      if (!clearing) {
        typed += 1;
        clearing = typed === length;
        wait = clearing ? pauseOnLine : perCharacter;
      } else {
        typed -= 1;
        wait = clearPerCharacter;
        if (typed === 0) {
          clearing = false;
          line = (line + 1) % questions.length;
          wait = beforeNext;
        }
      }
      setView({ line, typed });
      timer = window.setTimeout(step, wait);
    };

    const rest = () => {
      const should = onScreen && !document.hidden;
      if (should === awake) return;
      awake = should;
      window.clearTimeout(timer);
      if (awake) timer = window.setTimeout(step, beforeNext);
    };

    const watcher = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      rest();
    });
    watcher.observe(el);
    document.addEventListener("visibilitychange", rest);

    return () => {
      watcher.disconnect();
      document.removeEventListener("visibilitychange", rest);
      window.clearTimeout(timer);
    };
  }, [reduced]);

  const question = questions[line];

  return (
    <>
      <div
        ref={bar}
        aria-hidden
        className="flex min-h-22 items-center gap-3 rounded-lg border border-line bg-paper px-4 py-4 shadow-rest motion-reduce:hidden sm:px-5 md:min-h-23 xl:min-h-16"
      >
        <SearchIcon />
        <p className="min-w-0 flex-1 text-center text-body-l-mobile text-ink md:text-body-l beside:text-left">
          {question.slice(0, typed)}
          {/* The caret: no width of its own, so it never moves a letter. */}
          <span className="relative">
            <span className="kt-caret absolute top-[0.12em] left-0 h-[1.1em] w-0.5 rounded-pill bg-ink" />
          </span>
          <span className="invisible">{question.slice(typed)}</span>
        </p>
      </div>

      <ul className="sr-only divide-y divide-line rounded-lg border border-line bg-paper shadow-rest motion-reduce:not-sr-only">
        {questions.map((each) => (
          <li key={each} className="flex items-center gap-3 px-4 py-4 text-body-l-mobile text-ink sm:px-5 md:text-body-l">
            <SearchIcon />
            {each}
          </li>
        ))}
      </ul>
    </>
  );
}
