"use client";

import {
  queryOptions,
  useMutation,
  useMutationState,
  useQuery,
  useQueryClient,
  type MutationCache,
} from "@tanstack/react-query";
import { useCallback } from "react";
import { api, errorMessage, prepareMessage, type Draft } from "@/lib/api-client";
import type { Gift } from "@/lib/schemas";
import { keys } from "./keys";
import { pendingId, settle } from "./pending";

/** Every gift they have sealed, for everyone, oldest first. */
export const giftsQuery = queryOptions({ queryKey: keys.gifts, queryFn: api.gifts.list });

export const useGifts = () => useQuery(giftsQuery);

const sealing = ["gifts", "seal"];

/** A message on its way to being sealed: who it is for, what it is, and the gift it takes the place of, if any. */
export type Sealing = {
  personId: string;
  draft: Draft;
  replaces?: Gift;
  /** An earlier try that didn't go through, which this one takes over from. */
  retryOf?: number;
};

/** Let go of a try that is kept: it has been taken over, or they have decided against it. */
const drop = (mutations: MutationCache, id: number) => {
  const found = mutations.getAll().find((each) => each.mutationId === id);
  if (found) mutations.remove(found);
};

const bySealedAt = (a: Gift, b: Gift) => a.sealedAt.localeCompare(b.sealedAt);

/**
 * Seal a message for someone (uploading the recording first, for a voice
 * note). It joins their gifts at once, marked as still on its way, and takes
 * its real id when the server answers.
 *
 * If it doesn't go through, it comes back out, and whatever it replaced goes
 * back in. What they made is not lost: the try is kept, with its recording or
 * its words, for `useUnsealed` to offer again.
 */
export function useSealGift() {
  const client = useQueryClient();
  const mutations = client.getMutationCache();
  return useMutation({
    mutationKey: sealing,
    // A try that failed holds the only copy of what they made, so it is never tidied away by the clock.
    gcTime: Infinity,
    mutationFn: async ({ personId, draft, replaces }: Sealing) =>
      api.gifts.create({ ...(await prepareMessage(draft)), personId, replaces: replaces?.id }),
    onMutate: async ({ personId, draft, replaces, retryOf }) => {
      // This try takes over from the one that failed.
      if (retryOf !== undefined) drop(mutations, retryOf);
      // An answer asked for before this would not have it, and would take it back out.
      await client.cancelQueries({ queryKey: keys.gifts });
      const shown: Gift = {
        id: pendingId(),
        personId,
        kind: draft.kind,
        envelopeTitle: draft.envelopeTitle,
        letterText: draft.kind === "letter" ? draft.letterText : null,
        durationSeconds: draft.kind === "voice" ? Math.max(1, Math.round(draft.seconds)) : null,
        sealedAt: new Date().toISOString(),
      };
      client.setQueryData(giftsQuery.queryKey, (gifts = []) => [...gifts.filter((gift) => gift.id !== replaces?.id), shown]);
      return { shown };
    },
    onSuccess: (gift, _sealing, held) => {
      settle(held.shown.id, gift.id);
      client.setQueryData(giftsQuery.queryKey, (gifts = []) => gifts.map((each) => (each.id === held.shown.id ? gift : each)));
      // Sealed: the copy kept in case of failure is no longer needed. (Once this try has finished being recorded as done.)
      setTimeout(() => mutations.findAll({ mutationKey: sealing, status: "success" }).forEach((done) => mutations.remove(done)));
    },
    onError: (_problem, { replaces }, held) => {
      if (!held) return;
      client.setQueryData(giftsQuery.queryKey, (gifts = []) => {
        const without = gifts.filter((gift) => gift.id !== held.shown.id);
        const back = replaces && !without.some((gift) => gift.id === replaces.id);
        return back ? [...without, replaces].sort(bySealedAt) : without;
      });
    },
    onSettled: () => {
      // Gifts alone are asked for again. Not while another is still being sealed: that answer would be missing it.
      if (client.isMutating({ mutationKey: sealing }) > 1) return;
      // Not waited for: what changed is already showing, and the caller should hear the outcome now.
      void client.invalidateQueries({ queryKey: keys.gifts });
    },
  });
}

/** A message that didn't get sealed, kept so it can be tried again. */
export type Unsealed = Sealing & { id: number; message: string };

/** What didn't get sealed for this person since the page was opened. */
export function useUnsealed(personId: string): Unsealed[] {
  return useMutationState({
    filters: { mutationKey: sealing, status: "error" },
    select: (mutation): Unsealed => ({
      ...(mutation.state.variables as Sealing),
      id: mutation.mutationId,
      message: errorMessage(mutation.state.error),
    }),
  }).filter((each) => each.personId === personId);
}

/** They have decided not to keep one that didn't get sealed. */
export function useDiscardUnsealed() {
  const mutations = useQueryClient().getMutationCache();
  return useCallback((id: number) => drop(mutations, id), [mutations]);
}
