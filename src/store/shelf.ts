"use client";

import { queryOptions, useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { PracticalItem, PracticalItemCreate } from "@/lib/schemas";
import { keys } from "./keys";
import { settle } from "./pending";

/** "What they'll need to find": the practical shelf, oldest first. */
export const shelfQuery = queryOptions({ queryKey: keys.shelf, queryFn: api.practical.list });

export const useShelf = () => useQuery(shelfQuery);

const changingShelf = ["shelf", "change"];

/**
 * Put something on the shelf. It is there at once, under `shownAs` (an id
 * from `pendingId()`), and takes its real id when the server answers. If the
 * server refuses, it comes back off and the caller hears why.
 */
export function useAddToShelf() {
  const client = useQueryClient();
  return useMutation({
    mutationKey: changingShelf,
    mutationFn: ({ input }: { shownAs: string; input: PracticalItemCreate }) => api.practical.create(input),
    onMutate: async ({ shownAs, input }) => {
      // An answer asked for before this would not have it, and would take it back off.
      await client.cancelQueries({ queryKey: keys.shelf });
      const shown: PracticalItem = {
        id: shownAs,
        category: input.category,
        providerName: input.providerName.trim(),
        note: input.note?.trim() || null,
        createdAt: new Date().toISOString(),
      };
      client.setQueryData(shelfQuery.queryKey, (items = []) => [...items, shown]);
    },
    onSuccess: (item, { shownAs }) => {
      settle(shownAs, item.id);
      client.setQueryData(shelfQuery.queryKey, (items = []) => items.map((each) => (each.id === shownAs ? item : each)));
    },
    onError: (_problem, { shownAs }) => {
      client.setQueryData(shelfQuery.queryKey, (items = []) => items.filter((each) => each.id !== shownAs));
    },
    onSettled: () => refreshShelf(client),
  });
}

/** Take something off the shelf. It goes at once, and comes back where it was if the server refuses. */
export function useTakeOffShelf() {
  const client = useQueryClient();
  return useMutation({
    mutationKey: changingShelf,
    mutationFn: (item: PracticalItem) => api.practical.remove(item.id),
    onMutate: async (item) => {
      await client.cancelQueries({ queryKey: keys.shelf });
      const at = client.getQueryData(shelfQuery.queryKey)?.findIndex((each) => each.id === item.id) ?? -1;
      client.setQueryData(shelfQuery.queryKey, (items = []) => items.filter((each) => each.id !== item.id));
      return { at };
    },
    onError: (_problem, item, held) => {
      if (!held || held.at < 0) return;
      client.setQueryData(shelfQuery.queryKey, (items = []) =>
        items.some((each) => each.id === item.id) ? items : [...items.slice(0, held.at), item, ...items.slice(held.at)],
      );
    },
    onSettled: () => refreshShelf(client),
  });
}

/**
 * The shelf alone is asked for again, never the other lists. Not while
 * another change to it is still on its way: that answer would be missing it.
 */
function refreshShelf(client: QueryClient) {
  if (client.isMutating({ mutationKey: changingShelf }) > 1) return;
  // Not waited for: what was changed is already showing, and the caller should hear the outcome now.
  void client.invalidateQueries({ queryKey: keys.shelf });
}
