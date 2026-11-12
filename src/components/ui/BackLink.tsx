"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type MouseEvent } from "react";

/** The page the reader was on before this one, if they got here from inside the site. */
let previous: string | null = null;
let current: string | null = null;
/** How far down each page the reader last was. */
const scrolled = new Map<string, number>();
/** Where to put them when "Back" lands. The browser won't: StartAtTop turns its restoring off, so a refresh starts the story again. */
let returnTo: number | null = null;

/**
 * Remembers where the reader has been, so "Back" can return them there. Lives
 * in the root layout, renders nothing.
 */
export function RememberPath() {
  const pathname = usePathname();
  useEffect(() => {
    if (pathname === current) return;
    previous = current;
    current = pathname;
    if (returnTo !== null) {
      const top = returnTo;
      returnTo = null;
      requestAnimationFrame(() => window.scrollTo({ top, behavior: "instant" }));
    }
  }, [pathname]);

  useEffect(() => {
    const note = () => scrolled.set(window.location.pathname, window.scrollY);
    window.addEventListener("scroll", note, { passive: true });
    return () => window.removeEventListener("scroll", note);
  }, []);
  return null;
}

/**
 * "Back", at the top of every page other than the landing page. It takes the
 * reader back where they came from on the site, to the place they left it; if
 * they arrived from somewhere else (a search, a shared link), it goes home.
 */
export function BackLink({ className = "" }: { className?: string }) {
  const router = useRouter();

  const goBack = (event: MouseEvent<HTMLAnchorElement>) => {
    if (previous === null) return;
    event.preventDefault();
    returnTo = scrolled.get(previous) ?? 0;
    router.back();
  };

  return (
    <Link
      href="/"
      onClick={goBack}
      className={`-ml-1 inline-flex min-h-11 items-center gap-1.5 self-start pr-2 text-label text-ink transition-colors duration-200 ease-state hover:text-heartwood ${className}`}
    >
      <svg viewBox="0 0 24 24" aria-hidden className="size-5 fill-none stroke-current">
        <path d="M14.5 6l-6 6 6 6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Back
    </Link>
  );
}
