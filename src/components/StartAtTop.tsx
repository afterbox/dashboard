"use client";

import { useEffect } from "react";

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

    // Jump, don't glide: a smooth scroll here would play the zoom backwards.
    const target = document.getElementById(window.location.hash.slice(1));
    if (target) target.scrollIntoView({ behavior: "instant" });
    else window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  return null;
}
