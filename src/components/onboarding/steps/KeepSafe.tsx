"use client";

import { CodeSignIn } from "@/components/app/CodeSignIn";
import type { OnboardingState, Person } from "@/lib/schemas";
import { nextStep, signUpStep, stepPath } from "@/lib/onboarding";
import { trustLines } from "@/lib/trust-lines";
import { useOnboarding } from "../OnboardingProvider";
import { StepActions, StepFrame } from "../StepFrame";

/**
 * 3. Keep it safe: sign-up, after they have made something worth keeping.
 * Email, then a 6-digit code. The guest account and everything made so far
 * move to the real account as part of signing in.
 */
export function KeepSafe({ state, person }: { state: OnboardingState; person: Person }) {
  const { signedIn } = useOnboarding();

  return (
    <StepFrame title={`Let's keep this safe for ${person.name}.`}>
      <CodeSignIn
        googleEnabled={state.googleEnabled}
        returnTo={stepPath(nextStep(signUpStep) ?? signUpStep)}
        onSignedIn={signedIn}
        finishLabel="Keep it safe"
        Actions={StepActions}
      >
        <ul className="mt-5 space-y-1 text-small text-ink-muted short:mt-3">
          <li>{trustLines.sealed}</li>
          <li>{trustLines.data}</li>
        </ul>
      </CodeSignIn>
    </StepFrame>
  );
}
