"use client";

import { useEffect, useState } from "react";
import { Offer, offerPromise, paidSoon } from "@/components/app/Offer";
import { Button, Notice } from "@/components/app/ui";
import { errorMessage } from "@/lib/api-client";
import type { OnboardingState, Person, PlanChoice } from "@/lib/schemas";
import { pronounsFor } from "@/lib/words";
import { useReadyHome } from "@/store/home";
import { useCompleteOnboarding } from "@/store/session";
import { useOnboarding } from "../OnboardingProvider";
import { StepActions, StepFrame } from "../StepFrame";

/**
 * 7. Who else? The offer: two equal choices, and a promise that holds whichever
 * they pick. Payments aren't built, so the paid choice records interest, says
 * so, and carries on. Then home, with their person's box travelling there.
 */
export function Everyone({ state, person }: { state: OnboardingState; person: Person }) {
  const { save, finish: goHome } = useOnboarding();
  const { mutateAsync: complete } = useCompleteOnboarding();
  const readyHome = useReadyHome();
  const [chosen, setChosen] = useState<PlanChoice | null>(state.planChoice);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { their } = pronounsFor(person.relationship);

  // /home is next. Fetch what it shows while they choose, so their box is there on its first frame.
  useEffect(() => {
    void readyHome();
  }, [readyHome]);

  const finish = async () => {
    setBusy(true);
    setError(null);
    try {
      await complete();
      // Already fetched, nearly always. /home needs it to draw their box on its first frame, so the box can travel there.
      await readyHome();
      // The landing page's buttons now read "Go to your gifts".
      document.documentElement.setAttribute("data-member", "");
      goHome();
    } catch (problem) {
      setError(errorMessage(problem));
      setBusy(false);
    }
  };

  const choose = async (choice: PlanChoice) => {
    setBusy(true);
    setError(null);
    try {
      await save("everyone", { choice });
      setChosen(choice);
    } catch (problem) {
      setError(errorMessage(problem));
      setBusy(false);
      return;
    }
    // Free: straight on. Paid: first say that it isn't open yet.
    if (choice === "free") await finish();
    else setBusy(false);
  };

  return (
    <StepFrame title={`${person.name} has ${their} gift. Who else would you build one for?`}>
      <Offer chosen={chosen} onChoose={choose} disabled={busy} />
      <p className="mt-4 text-body text-ink">{offerPromise(person.name, person.relationship)}</p>
      <div className="mt-3 min-h-11">
        {chosen === "paid_interest" && <Notice tone="calm">{paidSoon}</Notice>}
      </div>
      <StepActions>
        <Notice>{error}</Notice>
        {chosen && (
          <Button full busy={busy} onClick={finish}>
            Continue
          </Button>
        )}
      </StepActions>
    </StepFrame>
  );
}
