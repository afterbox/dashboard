"use client";

import { Link } from "@/components/ui/Link";
import { useRouter, useSelectedLayoutSegment } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { GiftBox } from "@/components/app/GiftBox";
import { Wordmark } from "@/components/ui/Wordmark";
import {
  firstStep,
  isStep,
  previousStep,
  redirectFor,
  signUpStep,
  stepIndex,
  stepPath,
  steps,
  type Step,
  type Visitor,
} from "@/lib/onboarding";
import { useOnboarding } from "./OnboardingProvider";

/**
 * What stays put while the steps change: the wordmark, the quiet row of dots,
 * the gift box, and the way back in for someone who has already started.
 *
 * Gift mode. A phone first: one column with 20px margins. On a desktop the
 * same column, about 480px wide, centred on linen.
 */
export function OnboardingShell({ children }: { children: ReactNode }) {
  const segment = useSelectedLayoutSegment();
  const step: Step = isStep(segment) ? segment : firstStep;
  const router = useRouter();
  const { state, draftName, sealing, go, isMoving, arrived } = useOnboarding();

  /*
    The guard, again, in the browser. The routing guard (src/proxy.ts) has
    already had its say before the page arrived; this catches what it can't
    see, such as a step reached with the back button after signing in
    elsewhere. The server refuses out-of-order saves whatever happens here.
  */
  useEffect(() => {
    // On a new step: any move that was under way is over.
    arrived();
  }, [step, arrived]);

  useEffect(() => {
    if (!state || isMoving()) return;
    if (state.completed) {
      router.replace("/home");
      return;
    }
    const visitor: Visitor = state.user
      ? { kind: state.user.isGuest ? "guest" : "member", currentStep: state.currentStep, completed: false }
      : { kind: "none" };
    const to = redirectFor(stepPath(step), visitor);
    if (to) router.replace(to);
    // Only when they arrive on a step or what we know of them loads. Saving a
    // step moves them on by itself (with its slide), and must not be raced.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, state?.user?.isGuest, state?.completed, state === null]);

  const signedUp = Boolean(state?.user && !state.user.isGuest);

  // The way back. Once signed up there is nothing to go back to on the sign-up screen.
  let back = previousStep(step);
  if (back === signUpStep && signedUp) back = previousStep(back);

  // On the "who came to mind?" screen the tag follows what is being typed.
  const name = draftName ?? state?.person?.name ?? null;
  const rings = (name ? 1 : 0) + (state?.gift ? 1 : 0) + (state?.bank ? 1 : 0);
  const number = stepIndex(step) + 1;

  return (
    <div className="flex min-h-dvh flex-1 flex-col">
      <header className="pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex h-16 w-full max-w-300 items-center justify-between px-5 md:h-18 md:px-6">
          <Wordmark anchored />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-120 flex-1 flex-col px-5">
        {/* The way back (there is none from the first question), and the quiet row of dots. */}
        <div className="flex h-11 items-center justify-between">
          {back ? (
            <button
              type="button"
              onClick={() => go(back, step)}
              aria-label="Back"
              className="-ml-2.5 inline-flex size-11 items-center justify-center rounded-pill text-ink"
            >
              <svg viewBox="0 0 24 24" aria-hidden className="size-6 fill-none stroke-current">
                <path d="M14.5 6 8.5 12l6 6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ) : (
            <span />
          )}
          <div role="img" aria-label={`Step ${number} of ${steps.length}`} className="flex items-center gap-1.5">
            {steps.map((each, i) => (
              <span
                key={each}
                className={`h-1.5 rounded-pill transition-[width,background-color] duration-200 ease-state ${i + 1 === number ? "w-4 bg-keepsake" : i + 1 < number ? "w-1.5 bg-keepsake" : "w-1.5 bg-line"
                  }`}
              />
            ))}
          </div>
        </div>

        <GiftBox travels name={name} rings={rings} sealing={sealing} size="compact" className="mx-auto shrink-0" />

        {children}
      </main>

      {/* Until they have signed up, there is always a quiet way back in. */}
      <footer className="mx-auto w-full max-w-120 px-5 pb-[max(--spacing(3),env(safe-area-inset-bottom))] text-center">
        {signedUp ? (
          <div className="h-3" />
        ) : (
          <p className="text-small text-ink-muted">
            Already started a gift?{" "}
            <Link
              href="/signin"
              className="inline-flex min-h-11 items-center font-semibold text-ink underline decoration-line decoration-2 underline-offset-4"
            >
              Sign in
            </Link>
          </p>
        )}
      </footer>
    </div>
  );
}
