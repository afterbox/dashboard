/**
 * The name each thing is kept under in the store. One list per thing the
 * server keeps, so a change to one can refresh that one alone.
 */
export const keys = {
  /** Who is here, how far through onboarding they are, and their preferences (/api/session). */
  session: ["session"],
  people: ["people"],
  gifts: ["gifts"],
  /** "What they'll need to find": the practical shelf. */
  shelf: ["shelf"],
} as const;
