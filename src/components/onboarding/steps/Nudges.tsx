"use client";

import { useState } from "react";
import { Button, Notice, Switch } from "@/components/app/ui";
import { errorMessage } from "@/lib/api-client";
import type { OnboardingState } from "@/lib/schemas";
import { useOnboarding } from "../OnboardingProvider";
import { StepActions, StepFrame } from "../StepFrame";

/**
 * 6. Gentle nudges. Reminder emails: on to begin with, one tap to turn off.
 * The example shows the kind of thing a nudge says.
 */
export function Nudges({ state }: { state: OnboardingState }) {
  const { save, go } = useOnboarding();
  const [on, setOn] = useState(state.preference.reminderEmails);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const next = async () => {
    setBusy(true);
    setError(null);
    try {
      await save("nudges", { reminderEmails: on });
      go("everyone", "nudges");
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
