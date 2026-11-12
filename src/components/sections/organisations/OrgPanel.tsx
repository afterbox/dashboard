"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { partners } from "./partners";
import { talkShown } from "./signals";

// TODO: replace with the real partnerships address (or a contact form) before launch.
const talkTo = "mailto:partners@afterbox.co.uk?subject=afterbox%20for%20our%20people";

/**
 * Section 9's one panel, with three tabs: Employers, Insurers, Banks.
 *
 * Real tabs. They change only when chosen (a tap, a click, or the arrow keys,
 * Home and End); they never turn on their own. Choosing one changes three
 * things in the same panel and nothing else moves: the headline, the two
 * lines, and the example lockup.
 *
 * All three sets of words are always in the page, stacked in one cell, so
 * the panel is as tall as the tallest and never jumps. The ones not chosen
 * are see-through and `inert`.
 *
 * A phone: the tabs are a segmented control, three equal segments, 44px tall.
 * From tablets up: tabs along the top of the panel, with a line under the
 * chosen one.
 *
 * Motion: the marker slides to the chosen tab (`ease-state`, 240ms) while the
 * words and the example cross-fade in place (out 120ms, then in 200ms).
 * Reduced motion: both swap at once (the global rule shortens them).
 */
export function OrgPanel() {
  const id = useId();
  const [chosen, setChosen] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const talk = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const el = talk.current;
    if (!el) return;
    const watcher = new IntersectionObserver(([entry]) => talkShown.set(entry.isIntersecting));
    watcher.observe(el);
    return () => {
      watcher.disconnect();
      talkShown.set(false);
    };
  }, []);

  const choose = (i: number) => {
    setChosen(i);
    tabs.current[i]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const last = partners.length - 1;
    const to =
      event.key === "ArrowRight"
        ? (chosen + 1) % partners.length
        : event.key === "ArrowLeft"
          ? (chosen + last) % partners.length
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? last
              : -1;
    if (to < 0) return;
    event.preventDefault();
    choose(to);
  };

  return (
    <>
      <div className="rounded-xl border border-line bg-paper p-4 sm:p-6 md:p-10">
        <div
          role="tablist"
          aria-label="Who it's for"
          onKeyDown={onKeyDown}
          style={{ "--chosen": chosen } as CSSProperties}
          className="relative grid grid-cols-3 rounded-pill border border-line bg-linen p-1 md:max-w-md md:rounded-none md:border-0 md:border-b md:bg-transparent md:p-0"
        >
          {/* The marker: a pill behind the chosen segment on a phone, a line under the chosen tab from tablets up. */}
          <span
            aria-hidden
            className="absolute inset-y-1 left-1 w-[calc((100%-var(--spacing)*2)/3)] translate-x-[calc(var(--chosen)*100%)] rounded-pill border border-line bg-paper shadow-rest transition-[translate] duration-240 ease-state md:inset-y-auto md:-bottom-px md:left-0 md:h-0.5 md:w-1/3 md:rounded-none md:border-0 md:bg-heartwood md:shadow-none"
          />
          {partners.map((partner, i) => (
            <button
              key={partner.id}
              ref={(el) => {
                tabs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`${id}-tab-${partner.id}`}
              aria-selected={i === chosen}
              aria-controls={`${id}-panel-${partner.id}`}
              tabIndex={i === chosen ? 0 : -1}
              onClick={() => setChosen(i)}
              className={`relative h-11 rounded-pill text-label transition-colors duration-200 ease-state md:h-12 md:rounded-sm ${
                i === chosen ? "text-ink" : "text-ink-muted hover:text-ink"
              }`}
            >
              {partner.tab}
            </button>
          ))}
        </div>

        <div className="mt-8 grid">
          {partners.map((partner, i) => (
            <div
              key={partner.id}
              role="tabpanel"
              id={`${id}-panel-${partner.id}`}
              aria-labelledby={`${id}-tab-${partner.id}`}
              inert={i !== chosen}
              className={`col-start-1 row-start-1 grid gap-8 transition-opacity ease-state md:grid-cols-2 md:gap-10 ${
                i === chosen ? "opacity-100 delay-120 duration-200" : "opacity-0 duration-120"
              }`}
            >
              <div className="md:py-4">
                <h3 className="font-display max-w-md text-display-m-mobile text-balance text-ink md:text-display-m">
                  {partner.headline}
                </h3>
                <div className="mt-5 max-w-md space-y-3 text-body-l-mobile text-pretty text-ink-muted md:text-body-l">
                  {partner.lines.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              </div>

              <figure className="flex flex-col">
                <div className="flex min-h-64 flex-1 items-end justify-center rounded-lg bg-blush px-4 pt-8 md:px-8">
                  <div className={`flex w-full justify-center ${partner.runsOn ? "" : "pb-8"}`}>{partner.example}</div>
                </div>
                <figcaption className="mt-3 text-small text-ink-muted">{partner.caption}</figcaption>
              </figure>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 md:mt-10">
        <a
          ref={talk}
          href={talkTo}
          className="inline-flex h-12 w-full items-center justify-center rounded-pill bg-heartwood px-6 text-label whitespace-nowrap text-on-heartwood transition-colors duration-200 ease-state hover:bg-heartwood-deep md:h-13 md:w-auto md:px-8"
        >
          Talk to us
        </a>
      </div>
    </>
  );
}
