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
 */
export function useReadyHome() {
  const client = useQueryClient();
  return useCallback(async () => {
    await Promise.all([
      client.prefetchQuery(peopleQuery),
      client.prefetchQuery(giftsQuery),
      client.prefetchQuery(shelfQuery),
    ]);
  }, [client]);
}
