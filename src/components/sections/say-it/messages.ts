/**
 * Section 4: the three things Dad has left to be opened later, and who each
 * is for. The address is in his handwriting; the rest is afterbox speaking.
 */
export const messages = [
  {
    id: "letter",
    who: "Mary",
    address: "For Mary, on her 18th birthday",
    kind: "A letter",
    keeps: "Sealed until her 18th birthday. Only Mary will open it.",
  },
  {
    id: "voice",
    who: "Jo",
    address: "For Jo, for when the house feels quiet",
    kind: "A voice note",
    keeps: "Kept for Jo. Only Jo will hear it.",
  },
  {
    id: "video",
    who: "Mum",
    address: "For Mum",
    kind: "A video",
    keeps: "Kept for Mum. Only she will see it.",
  },
] as const;

export type Message = (typeof messages)[number];

/** Dad's letter to Mary, a line at a time. */
export const letter = [
  "Mary,",
  "Eighteen today. How did that happen?",
  "The practical things are all in the box.",
  "This is the part that isn't practical:",
  "I'm so proud of you. I always was.",
  "Love, Dad x",
] as const;

/** How long the voice note for Jo runs, in seconds. */
export const voiceLength = 42;

/** Minutes and seconds, as a recorder shows them. */
export const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
