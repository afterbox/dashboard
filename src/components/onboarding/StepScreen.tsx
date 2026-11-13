"use client";

import type { Step } from "@/lib/onboarding";
import { useOnboarding } from "./OnboardingProvider";
import { StepWaiting } from "./StepFrame";
import { Everyone } from "./steps/Everyone";
import { Find } from "./steps/Find";
import { KeepSafe } from "./steps/KeepSafe";
import { Message } from "./steps/Message";
import { Nudges } from "./steps/Nudges";
import { Reach } from "./steps/Reach";
import { Someone } from "./steps/Someone";

/**
 * The screen for one step (docs/onboarding-story.md). The first question needs
 * nothing loaded to be asked, so it shows at once (and the gift box can travel
 * straight to it from the landing page). Every other step waits for what has
 * been made so far, so it opens exactly as it was left.
 */
export function StepScreen({ step }: { step: Step }) {
  const { state, failed, refresh } = useOnboarding();

  if (step === "someone") return <Someone state={state} />;
  if (!state) return <StepWaiting failed={failed} onRetry={refresh} />;

  // Everything from here is about the person they named. Without one, the shell is already sending them back.
  const { person } = state;
  if (!person) return <StepWaiting failed={false} onRetry={refresh} />;

  switch (step) {
    case "message":
      return <Message state={state} person={person} />;
    case "keep-safe":
      return <KeepSafe state={state} person={person} />;
    case "reach":
      return <Reach person={person} />;
    case "find":
      return <Find state={state} />;
    case "nudges":
      return <Nudges state={state} />;
    case "everyone":
      return <Everyone state={state} person={person} />;
  }
}
