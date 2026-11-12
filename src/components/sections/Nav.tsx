"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { addItShown } from "@/components/sections/fill-it/signals";
import { heroCta, zoomStarted } from "@/components/sections/hero/signals";
import { GiftButton } from "@/components/ui/GiftButton";
import { Wordmark } from "@/components/ui/Wordmark";

const links = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#for-families", label: "For families" },
  { href: "#for-organisations", label: "For organisations" },
];

/** True once the hero has scrolled up behind the nav. */
function usePastHero(header: RefObject<HTMLElement | null>) {
  const [past, setPast] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("hero");
    if (!hero || !header.current) return;
    const observer = new IntersectionObserver(([entry]) => setPast(!entry.isIntersecting), {
      // Shrink the viewport by the nav's own height, so "past" means under the nav.
      rootMargin: `-${header.current.offsetHeight}px 0px 0px 0px`,
    });
    observer.observe(hero);
    return () => observer.disconnect();
  }, [header]);

  return past;
}

// 0. Navigation: who we are, quietly.
export function Nav() {
  const header = useRef<HTMLElement>(null);
  const pastHero = usePastHero(header);
  // Another heartwood button is in view: the hero's own, or "Add it" in section 3's demo.
  const heroCtaShown = heroCta.useValue();
  const demoActionShown = addItShown.useValue();
  const otherActionShown = heroCtaShown || demoActionShown;
  const zooming = zoomStarted.useValue();
  const sheet = useRef<HTMLDialogElement>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // The sheet is for phones only. Close it if the screen grows past it.
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 48rem)");
    const close = () => desktop.matches && sheet.current?.close();
    desktop.addEventListener("change", close);
    return () => desktop.removeEventListener("change", close);
  }, []);

  const openSheet = () => {
    sheet.current?.showModal();
    setSheetOpen(true);
  };
  const closeSheet = () => sheet.current?.close();

  return (
    <header ref={header} className="fixed inset-x-0 top-0 z-50 pt-[env(safe-area-inset-top)]">
      {/*
        Transparent over the street at rest. Once the zoom starts and the art
        passes underneath, and for the rest of the page: solid linen with a
        hairline. Solid, never frosted.
      */}
      <div
        aria-hidden
        className={`absolute inset-0 border-b border-line bg-linen transition-opacity duration-200 ease-state ${
          pastHero || zooming ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* A container, so the pill can tighten on the narrowest phones without touching the side margins. */}
      <div className="@container relative mx-auto flex h-16 w-full max-w-300 items-center justify-between px-5 md:h-18 md:px-6">
        <Wordmark />

        <div className="flex items-center gap-1 md:gap-8">
          <nav aria-label="Main" className="hidden md:block">
            <ul className="flex items-center gap-8">
              {links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="inline-flex min-h-11 items-center text-label text-ink transition-colors duration-200 ease-state hover:text-heartwood"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <GiftButton
            variant={otherActionShown ? "quiet" : "solid"}
            className="@max-xs:px-3"
          />

          <button
            type="button"
            onClick={openSheet}
            aria-haspopup="dialog"
            aria-expanded={sheetOpen}
            aria-label="Open menu"
            className="-mr-2.5 inline-flex size-11 items-center justify-center rounded-pill text-ink md:hidden"
          >
            <svg viewBox="0 0 24 24" aria-hidden className="size-6 fill-none stroke-current">
              <path d="M4 9h16M4 15h16" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Phones: the links live in a bottom sheet. Tapping outside it closes it. */}
      <dialog
        ref={sheet}
        aria-label="Menu"
        onClose={() => setSheetOpen(false)}
        onClick={(event) => event.target === event.currentTarget && closeSheet()}
        className="fixed inset-x-0 top-auto bottom-0 m-0 w-full max-w-none translate-y-full rounded-t-xl border border-b-0 border-line bg-paper text-ink opacity-0 shadow-rest transition-[translate,opacity,display,overlay] transition-discrete duration-480 ease-gift backdrop:bg-linen/80 backdrop:opacity-0 backdrop:transition-[opacity,display,overlay] backdrop:transition-discrete backdrop:duration-480 open:translate-y-0 open:opacity-100 open:backdrop:opacity-100 starting:open:translate-y-full starting:open:opacity-0 starting:open:backdrop:opacity-0"
      >
        <div className="px-5 pt-3 pb-[max(--spacing(5),env(safe-area-inset-bottom))]">
          <div aria-hidden className="mx-auto h-1 w-10 rounded-pill bg-line" />
          <nav aria-label="Main">
            <ul className="mt-3">
              {links.map((link) => (
                <li key={link.href} className="border-b border-line">
                  <a
                    href={link.href}
                    onClick={closeSheet}
                    className="font-display flex min-h-16 items-center text-display-s-mobile text-ink"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <button
            type="button"
            onClick={closeSheet}
            className="mt-5 inline-flex h-12 items-center rounded-pill border border-ink-muted px-6 text-label text-ink"
          >
            Close
          </button>
        </div>
      </dialog>
    </header>
  );
}
