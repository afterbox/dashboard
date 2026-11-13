/**
 * A cookie the routing guard sets for someone who has finished onboarding, so
 * the landing page (which is static) can say "Go to your gifts". It is only a
 * hint for the words on a button: it is not the session and it opens nothing.
 */
export const homeHintCookie = "afterbox.home";

/** Where the theme choice is kept on the device. */
export const themeStorageKey = "afterbox-theme";

/**
 * Runs in <head> before the first paint, so neither the theme nor the button's
 * words flash: sets `data-theme` from the saved choice (nothing saved means
 * System) and `data-member` when the hint cookie is there.
 */
export const beforePaintScript = `(function(){try{var d=document.documentElement,t=localStorage.getItem(${JSON.stringify(
  themeStorageKey,
)});if(t==="light"||t==="dark")d.setAttribute("data-theme",t);if(document.cookie.split("; ").indexOf(${JSON.stringify(
  `${homeHintCookie}=1`,
)})>-1)d.setAttribute("data-member","")}catch(e){}})()`;
