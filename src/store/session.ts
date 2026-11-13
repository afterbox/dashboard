"use client";

import { queryOptions, useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { api } from "@/lib/api-client";
import type { Step } from "@/lib/onboarding";
import type { OnboardingState, PlanChoice, Preference, PreferenceUpdate } from "@/lib/schemas";
import { hasLeft, someoneArrived } from "./client";
import { keys } from "./keys";

/**
 * The session: who is here, how far through onboarding they are, what they
 * made there, and their preferences. Onboarding, /signin and /home all read
 * this one copy.
 */
export const sessionQuery = queryOptions({ queryKey: keys.session, queryFn: api.session.get });

export const useSession = () => useQuery(sessionQuery);

/**
 * The server has just said how things stand. Keep that, and stop any answer
 * asked for earlier from landing on top of it.
 */
async function hold(client: QueryClient, state: OnboardingState) {
  await client.cancelQueries({ queryKey: keys.session });
  client.setQueryData(sessionQuery.queryKey, state);
}

const change = (client: QueryClient, to: (state: OnboardingState) => OnboardingState) =>
  client.setQueryData(sessionQuery.queryKey, (state) => state && to(state));

/** Begin as a guest, so what they make is kept from the first screen. Harmless if they already have a session. */
export function useBegin() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => api.session.begin(),
    onSuccess: (state) => hold(client, state),
  });
}

/** Which lists a step adds to. Those are refreshed the next time they are read; nothing else is. */
const listsFor: Partial<Record<Step, readonly (readonly string[])[]>> = {
  someone: [keys.people],
  reach: [keys.people],
  message: [keys.gifts],
  find: [keys.shelf],
};

/** Save an onboarding step. What comes back is how things now stand. */
export function useSaveStep() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ step, input }: { step: Step; input?: unknown }) => api.onboarding.save(step, input),
    onSuccess: async (state, { step }) => {
      await hold(client, state);
      for (const queryKey of listsFor[step] ?? []) void client.invalidateQueries({ queryKey });
    },
  });
}

/** Onboarding is finished. */
export function useCompleteOnboarding() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => api.onboarding.complete(),
    onSuccess: (state) => hold(client, state),
  });
}

/**
 * They have just signed in (the code was right). Ask who they are afresh:
 * a guest's work has moved to their account, or this is someone coming back.
 */
export function useSignedIn() {
  const client = useQueryClient();
  return useCallback(() => {
    someoneArrived(client);
    return client.fetchQuery({ ...sessionQuery, staleTime: 0 });
  }, [client]);
}

/** Sign out, here or on every device. What was loaded goes once /home has left the screen. */
export function useSignOut() {
  return useMutation({
    mutationFn: async ({ everywhere }: { everywhere: boolean }) => {
      if (everywhere) await api.auth.signOutEverywhere();
      await api.auth.signOut().catch(() => {});
    },
    onSuccess: hasLeft,
  });
}

/** How they sign their gifts: "Dad", "Mum", "Grandpa Joe". */
export function useSaveSignOff() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.auth.setName(name),
    onSuccess: (_, name) => {
      change(client, (state) => ({ ...state, user: state.user && { ...state.user, name: name || null } }));
      void client.invalidateQueries({ queryKey: keys.session });
    },
  });
}

const savingPreferences = ["preferences", "save"];

/**
 * Theme and reminder emails. The choice shows at once; if saving fails it
 * goes back to what is saved, and the caller says so.
 */
export function useSavePreferences() {
  const client = useQueryClient();
  const show = (preference: Partial<Preference>) =>
    change(client, (state) => ({ ...state, preference: { ...state.preference, ...preference } }));
  return useMutation({
    mutationKey: savingPreferences,
    // One at a time, in the order they were chosen, so the last choice is the one that stays.
    scope: { id: "preferences" },
    mutationFn: (update: PreferenceUpdate) => api.preferences.update(update),
    onMutate: async (update) => {
      await client.cancelQueries({ queryKey: keys.session });
      const before = client.getQueryData(sessionQuery.queryKey)?.preference;
      show(update);
      return { before };
    },
    onError: (_problem, update, held) => {
      const before = held?.before;
      if (!before) return;
      // Only what this change touched: a later choice may already be showing.
      show(Object.fromEntries(Object.keys(update).map((name) => [name, before[name as keyof Preference]])));
    },
    onSuccess: (preference) => {
      // What the server now has, unless a later choice is still on its way.
      if (client.isMutating({ mutationKey: savingPreferences }) === 1) show(preference);
    },
  });
}

/** The offer: carry on free, or say they'd like the paid plan when it opens. */
export function useChoosePlan() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (choice: PlanChoice) => api.plan.choose(choice),
    onSuccess: ({ choice }) => {
      change(client, (state) => ({ ...state, planChoice: choice }));
    },
  });
}
