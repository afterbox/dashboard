"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { signUpStep, stepIndex, stepPath, type Step } from "@/lib/onboarding";
import type { OnboardingState } from "@/lib/schemas";
import { useBegin, useSaveStep, useSession, useSignedIn } from "@/store/session";

type Onboarding = {
  /** Who is here and what they have made so far. Null until it has loaded. */
  state: OnboardingState | null;
  /** Loading it failed (no connection, usually). */
  failed: boolean;
  /** Ask again: after signing in, or to try again after a failure. */
  refresh: () => Promise<OnboardingState | null>;
  /** Save a step. What comes back is the new state. */
  save: (step: Step, input?: unknown) => Promise<OnboardingState>;
  /** Begin as a guest, so what they make is kept from the first screen. */
  begin: () => Promise<OnboardingState>;
  /** The name as it is being typed, for the tag on the box, before it is saved. */
  draftName: string | null;
  setDraftName: (name: string | null) => void;
  /** Changes each time something is sealed: the envelope drops in and the box glows. */
  sealing: number | null;
  celebrate: () => void;
  /** Move to a step. Forward slides in from the right; back, from the left. */
  go: (step: Step, from: Step) => void;
  /**
   * They have just signed in on the "keep it safe" screen. What they made as a
   * guest has moved to their account; carry on from wherever that account is.
   */
  signedIn: () => Promise<void>;
  /** Onboarding is finished: on to /home, with their person's box travelling there. */
  finish: () => void;
  /** True while a move is under way, so the shell's guard doesn't send them somewhere a second time. */
  isMoving: () => boolean;
  /** The shell says so when a step has arrived: any move that was under way is over. */
  arrived: () => void;
};

const OnboardingContext = createContext<Onboarding | null>(null);

export function useOnboarding() {
  const value = useContext(OnboardingContext);
  if (!value) throw new Error("useOnboarding needs <OnboardingProvider>.");
  return value;
}

/**
 * What every onboarding screen shares. It sits in the /start layout, so it
 * stays as the steps change. Who is here and what they have made is the
 * session in the store (src/store/session.ts): nothing is fetched again
 * between screens, saving a step puts the server's answer straight in, and a
 * refresh loads it once, from what was saved.
 */
export function OnboardingProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const session = useSession();
  const state = session.data ?? null;
  const failed = session.isError && !session.data;
  const { mutateAsync: saveStep } = useSaveStep();
  const { mutateAsync: begin } = useBegin();
  const askWhoIsHere = useSignedIn();
  const [draftName, setDraftName] = useState<string | null>(null);
  const [sealing, setSealing] = useState<number | null>(null);
  const count = useRef(0);
  const moving = useRef(false);

  const { refetch } = session;
  const refresh = useCallback(async () => (await refetch()).data ?? null, [refetch]);

  const save = useCallback((step: Step, input?: unknown) => saveStep({ step, input }), [saveStep]);

  const celebrate = useCallback(() => {
    count.current += 1;
    setSealing(count.current);
  }, []);

  const go = useCallback(
    (step: Step, from: Step) => {
      const forward = stepIndex(step) > stepIndex(from);
      moving.current = true;
      router.push(stepPath(step), { transitionTypes: [forward ? "step-forward" : "step-back"] });
    },
    [router],
  );

  const signedIn = useCallback(async () => {
    moving.current = true;
    try {
      const loaded = await askWhoIsHere();
      // An account that has been here before and finished: straight to their gifts.
      if (loaded.completed) {
        router.push("/home");
        return;
      }
      const saved = await save(signUpStep);
      go(saved.currentStep, signUpStep);
    } catch (problem) {
      moving.current = false;
      throw problem;
    }
  }, [router, askWhoIsHere, save, go]);

  const finish = useCallback(() => {
    moving.current = true;
    router.push("/home", { transitionTypes: ["to-gift"] });
  }, [router]);

  const isMoving = useCallback(() => moving.current, []);
  const arrived = useCallback(() => {
    moving.current = false;
  }, []);

  const value = useMemo(
    () => ({
      state,
      failed,
      refresh,
      save,
      begin,
      draftName,
      setDraftName,
      sealing,
      celebrate,
      go,
      signedIn,
      finish,
      isMoving,
      arrived,
    }),
    [state, failed, refresh, save, begin, draftName, sealing, celebrate, go, signedIn, finish, isMoving, arrived],
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}
