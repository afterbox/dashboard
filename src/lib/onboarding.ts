/**
 * Every onboarding step there is, in order (docs/onboarding-story.md). Each has
 * its own address, /start/<step>, so a refresh or the back button lands on the
 * same screen, and we can bring someone back exactly where they left off.
 */
export const allSteps = [
  "someone",
  "message",
  "keep-safe",
  "reach",
  "find",
  "nudges",
  "everyone",
] as const;

export type Step = (typeof allSteps)[number];

/**
 * The offer ("Who else would you build one for?") is kept but not asked for
 * now: onboarding ends after the nudges, on the free plan.
 */
export const offerInOnboarding = false;

/** The steps that are shown, in order. Everything below works from these. */
export const steps: readonly Step[] = allSteps.filter((step) => offerInOnboarding || step !== "everyone");

/** The step onboarding ends on. */
export const lastStep: Step = steps[steps.length - 1];

/** The landing page has already said what this is, so onboarding opens on its first question. */
export const firstStep: Step = "someone";
/** Sign-up. Everything after it needs a real account. */
export const signUpStep: Step = "keep-safe";

export const isStep = (value: unknown): value is Step =>
  typeof value === "string" && (steps as readonly string[]).includes(value);

export const stepIndex = (step: Step) => steps.indexOf(step);

/**
 * A saved step, as one that is shown: a step that isn't shown any more reads
 * as the shown one before it; one that no longer exists (there was once a
 * welcome screen) as the first.
 */
export function shownStep(value: string): Step {
  if (isStep(value)) return value;
  const at = (allSteps as readonly string[]).indexOf(value);
  if (at === -1) return firstStep;
  return [...allSteps.slice(0, at)].reverse().find(isStep) ?? firstStep;
}

/** The step after this one, or null after the last. */
export const nextStep = (step: Step): Step | null => steps[stepIndex(step) + 1] ?? null;

/** The step before this one, or null before the first. */
export const previousStep = (step: Step): Step | null => steps[stepIndex(step) - 1] ?? null;

export const stepPath = (step: Step) => `/start/${step}` as const;

/** What the routing guard needs to know about whoever is asking. */
export type Visitor =
  | { kind: "none" }
  | { kind: "guest" | "member"; currentStep: Step; completed: boolean };

/**
 * The furthest step someone may be on.
 *
 * - Nobody yet: the first question.
 * - A guest can't go past sign-up.
 * - Someone signed in has nothing to do on the sign-up screen: if that is
 *   where they were (the account was made, but the step wasn't saved before
 *   the page closed), they are on the one after it.
 */
export function reachedStep(visitor: Visitor): Step {
  if (visitor.kind === "none") return firstStep;
  const currentStep = shownStep(visitor.currentStep);
  if (visitor.kind === "guest") {
    return stepIndex(currentStep) > stepIndex(signUpStep) ? signUpStep : currentStep;
  }
  return currentStep === signUpStep ? (nextStep(signUpStep) as Step) : currentStep;
}

/**
 * Where a request should go instead, or null to let it through.
 * The rules, in one place, for the routing guard (src/proxy.ts) and its tests.
 */
export function redirectFor(pathname: string, visitor: Visitor): string | null {
  const finished = visitor.kind !== "none" && visitor.completed;
  const reached = reachedStep(visitor);

  if (pathname === "/home" || pathname.startsWith("/home/")) {
    return finished ? null : stepPath(reached);
  }

  if (pathname === "/signin") {
    if (finished) return "/home";
    // Someone with a real account who hasn't finished carries on where they were.
    return visitor.kind === "member" ? stepPath(reached) : null;
  }

  if (pathname === "/start" || pathname.startsWith("/start/")) {
    if (finished) return "/home";
    const asked = pathname.split("/")[2];
    if (!isStep(asked)) return stepPath(reached);
    // Back is always allowed; ahead of where they've reached is not.
    if (stepIndex(asked) > stepIndex(reached)) return stepPath(reached);
    // Once signed up, the sign-up screen has nothing left to ask.
    if (asked === signUpStep && visitor.kind === "member") return stepPath(reached);
    return null;
  }

  return null;
}
