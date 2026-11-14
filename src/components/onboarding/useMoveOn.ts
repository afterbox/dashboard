"use client";

import { useCallback, useEffect } from "react";
import { nextStep, type Step } from "@/lib/onboarding";
import { useReadyHome } from "@/store/home";
import { useCompleteOnboarding } from "@/store/session";
import { useOnboarding } from "./OnboardingProvider";

/**
 * What a step does once it is saved: on to the next step or, from the last
 * one, home, with their person's box travelling there. Which step is the last
 * is decided in one place (src/lib/onboarding.ts), so a screen never has to know.
 */
export function useMoveOn(step: Step) {
  const { go, finish } = useOnboarding();
  const { mutateAsync: complete } = useCompleteOnboarding();
  const readyHome = useReadyHome();
  const next = nextStep(step);

  // /home is next. Fetch what it shows now, so their box is there on its first frame.
  // (Not the shelf from the bank step, which is about to add to it: that is read once, after it is saved.)
  useEffect(() => {
    if (!next) void readyHome({ shelf: step !== "find" });
  }, [next, step, readyHome]);

  return useCallback(async () => {
    if (next) {
      go(next, step);
      return;
    }
    await complete();
    // Already fetched, nearly always. /home needs it to draw their box on its first frame, so the box can travel there.
    await readyHome();
    // The landing page's buttons now read "Go to your gifts".
    document.documentElement.setAttribute("data-member", "");
    finish();
  }, [next, step, go, complete, readyHome, finish]);
}
