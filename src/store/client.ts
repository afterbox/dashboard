import { isServer, MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api-client";
import { keys } from "./keys";

/**
 * The store: what the browser holds of what the server keeps, through
 * TanStack Query. There is no second copy of anything. Each list (people,
 * gifts, the shelf) and the session is fetched once, shared by every screen
 * that reads it, and refreshed by itself when it changes.
 *
 * This file is the one place for how that behaves:
 * - how long something counts as fresh, and when it is asked for again
 *   (coming back to the tab, coming back online);
 * - what is worth trying again, and what is not;
 * - what happens when the server says nobody is signed in.
 *
 * The lists and what can be done to them are beside this file, one file per
 * thing. Components read and change things through those, never through
 * `fetch`.
 */

const notSignedIn = (error: unknown) => error instanceof ApiError && error.status === 401;

/** No connection, or our side fell over. A refusal (4xx) is never tried again: asking twice gets the same answer. */
const worthAnotherTry = (error: unknown) => error instanceof ApiError && (error.status === 0 || error.status >= 500);

/*
  Whoever was here has gone: they signed out, or the server says they are no
  longer signed in. What was loaded for them is forgotten as soon as the screen
  showing it has gone (not before, or it would blink empty on the way out), so
  nothing of theirs is ever shown to whoever is here next.
*/
let gone = false;
let whenFoundSignedOut: (() => void) | null = null;

/** They signed out themselves. */
export const hasLeft = () => {
  gone = true;
};

/** Say what to do when someone on /home turns out not to be signed in any more. */
export function onFoundSignedOut(act: () => void) {
  whenFoundSignedOut = act;
  return () => {
    if (whenFoundSignedOut === act) whenFoundSignedOut = null;
  };
}

function foundSignedOut() {
  // Only where their things are on screen. Onboarding says so in its own words, on the step.
  if (gone || !window.location.pathname.startsWith("/home")) return;
  gone = true;
  whenFoundSignedOut?.();
}

/** Their people, gifts and shelf, and anything still waiting to be sealed. */
const dropTheirThings = (client: QueryClient) => {
  client.getMutationCache().clear();
  client.removeQueries({ predicate: (query) => query.queryKey[0] !== keys.session[0] });
};

/** Once the screen has changed: if whoever was here has gone, forget what was loaded for them. */
export function forgetWhoLeft(client: QueryClient) {
  if (!gone) return;
  gone = false;
  dropTheirThings(client);
  // The session is asked for again wherever it is on screen: it now says nobody is here.
  void client.resetQueries({ queryKey: keys.session });
}

/** Someone has just signed in. They may not be who was here before, so nothing is carried over. */
export function someoneArrived(client: QueryClient) {
  gone = false;
  dropTheirThings(client);
}

function makeQueryClient() {
  const whenItFails = (error: unknown) => {
    if (notSignedIn(error)) foundSignedOut();
  };
  return new QueryClient({
    queryCache: new QueryCache({ onError: whenItFails }),
    mutationCache: new MutationCache({ onError: whenItFails }),
    defaultOptions: {
      queries: {
        // Moving between screens reuses what was just loaded. Anything older is shown at once and refreshed behind.
        staleTime: 30_000,
        retry: (failures, error) => failures < 2 && worthAnotherTry(error),
        // Always try. With no connection the request fails and says so kindly, where waiting silently would say nothing.
        networkMode: "always",
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
      },
      mutations: {
        // Saving is never repeated behind their back: a failure is shown, and they choose.
        retry: false,
        networkMode: "always",
      },
    },
  });
}

let browserClient: QueryClient | undefined;

/**
 * One store for the whole visit in the browser, so onboarding and /home read
 * the same things. On the server, a new one for each render: nothing is ever
 * shared between two people's requests.
 */
export function getQueryClient() {
  if (isServer) return makeQueryClient();
  browserClient ??= makeQueryClient();
  return browserClient;
}
