/**
 * The onboarding steps, in order (docs/onboarding-story.md). Each has its own
 * address, /start/<step>, so a refresh or the back button lands on the same
 * screen, and we can bring someone back exactly where they left off.
 */
export const steps = [
  "someone",
  "message",
  "keep-safe",
  "reach",
  "find",
  "nudges",
  "everyone",
] as const;

export type Step = (typeof steps)[number];

/** The landing page has already said what this is, so onboarding opens on its first question. */
export const firstStep: Step = "someone";
/** Sign-up. Everything after it needs a real account. */
export const signUpStep: Step = "keep-safe";

export const isStep = (value: unknown): value is Step =>
  typeof value === "string" && (steps as readonly string[]).includes(value);

export const stepIndex = (step: Step) => steps.indexOf(step);

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
  const { currentStep } = visitor;
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
