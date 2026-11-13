"use client";

import { useEffect, useState } from "react";
import { Button, Notice, Switch } from "@/components/app/ui";
import { errorMessage } from "@/lib/api-client";
import { nextStep } from "@/lib/onboarding";
import type { OnboardingState } from "@/lib/schemas";
import { useReadyHome } from "@/store/home";
import { useCompleteOnboarding } from "@/store/session";
import { useOnboarding } from "../OnboardingProvider";
import { StepActions, StepFrame } from "../StepFrame";

/** While the offer isn't part of onboarding, this is the last step: it leads home. */
const then = nextStep("nudges");

/**
 * 6. Gentle nudges. Reminder emails: on to begin with, one tap to turn off.
 * The example shows the kind of thing a nudge says.
 */
export function Nudges({ state }: { state: OnboardingState }) {
  const { save, go, finish } = useOnboarding();
  const { mutateAsync: complete } = useCompleteOnboarding();
  const readyHome = useReadyHome();
  const [on, setOn] = useState(state.preference.reminderEmails);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // /home may be next. Fetch what it shows now, so their box is there on its first frame.
  useEffect(() => {
    if (!then) void readyHome();
  }, [readyHome]);

  const next = async () => {
    setBusy(true);
    setError(null);
    try {
      await save("nudges", { reminderEmails: on });
      if (then) {
        go(then, "nudges");
        return;
      }
      await complete();
      // Already fetched, nearly always. /home needs it to draw their box on its first frame, so the box can travel there.
      await readyHome();
      // The landing page's buttons now read "Go to your gifts".
      document.documentElement.setAttribute("data-member", "");
      finish();
    } catch (problem) {
      setError(errorMessage(problem));
      setBusy(false);
    }
  };

  return (
    <StepFrame title="Life changes. Want a gentle nudge when it does?">
      <div className="space-y-6">
        {/* An example of a nudge, as it might arrive. */}
        <figure className="rounded-lg border border-line bg-paper p-4">
          <figcaption className="eyebrow text-ink-muted">For example</figcaption>
          <p className="mt-2 font-display text-display-s-mobile text-ink">You bought a home. Add it?</p>
        </figure>
        <Switch
          label="Reminder emails"
          hint="Only when something in life changes. Easy to turn off."
          checked={on}
          onChange={setOn}
        />
      </div>
      <StepActions>
        <Notice>{error}</Notice>
        <Button full busy={busy} onClick={next}>
          Continue
        </Button>
      </StepActions>
    </StepFrame>
  );
}
