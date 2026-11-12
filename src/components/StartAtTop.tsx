"use client";

import { useEffect } from "react";

/** How long a link's place is held while the page is still arriving, in milliseconds. */
const holdFor = 3000;
/** What the reader does to take over. From then on the scroll is theirs. */
const takesOver = ["wheel", "touchstart", "pointerdown", "keydown"] as const;

/**
 * A refresh starts the story from the beginning.
 *
 * Browsers put you back where you were on reload, which here means deep in the
 * hero's zoom. This turns that off and goes to the top instead. A link to a
 * place on the page (#how-it-works) still goes there.
 *
 * Runs once, when the page first loads. Renders nothing.
 */
export function StartAtTop() {
  useEffect(() => {
    history.scrollRestoration = "manual";

    const target = document.getElementById(window.location.hash.slice(1));
    if (!target) {
      window.scrollTo({ top: 0, behavior: "instant" });
      return;
    }

    // Jump, don't glide: a smooth scroll here would play the zoom backwards.
    const land = () => target.scrollIntoView({ behavior: "instant" });
    land();

    // The sections under the hero are put in place a moment after it
    // (sections/lazy.tsx), and the page grows as they are. Keep the link's
    // place each time it does, until the page has settled or the reader moves.
    const page = new ResizeObserver(land);
    page.observe(document.body);
    const letGo = () => {
      page.disconnect();
      clearTimeout(settled);
      for (const type of takesOver) window.removeEventListener(type, letGo);
    };
    const settled = setTimeout(letGo, holdFor);
    for (const type of takesOver) window.addEventListener(type, letGo, { passive: true });
    return letGo;
  }, []);

  return null;
}
