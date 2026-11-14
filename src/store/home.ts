"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { giftsQuery } from "./gifts";
import { peopleQuery } from "./people";
import { shelfQuery } from "./shelf";

/**
 * Fetch what /home shows ahead of going there: their people, gifts and shelf.
 * Onboarding does this on its last step, so /home can draw their person's
 * gift box on its very first frame and the box can travel there without a
 * blink. What is already fresh is not asked for twice. It never fails: if
 * something can't be fetched now, /home asks again when it opens.
 *
 * `shelf: false` leaves the shelf for later: for a screen that is about to add
 * to it, so it is read once, after that, rather than twice.
 */
export function useReadyHome() {
  const client = useQueryClient();
  return useCallback(
    async ({ shelf = true }: { shelf?: boolean } = {}) => {
      await Promise.all([
        client.prefetchQuery(peopleQuery),
        client.prefetchQuery(giftsQuery),
        shelf ? client.prefetchQuery(shelfQuery) : null,
      ]);
    },
    [client],
  );
}
