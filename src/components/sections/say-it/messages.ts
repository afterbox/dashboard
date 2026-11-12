/**
 * Section 4: what Dad has left to be opened later. A letter for Mary, a voice
 * note for Jo, a video for Mum. (Who each is for is set beside it, in his
 * handwriting: see ./SayStage.tsx.)
 */

/** Dad's letter to Mary, a line at a time. */
export const letter = [
  "Mary,",
  "Eighteen today. How did that happen?",
  "The practical things are all in the box.",
  "This is the part that isn't practical:",
  "I'm so proud of you. I always was.",
  "Love, Dad x",
] as const;

/** How long the voice note for Jo and the video for Mum run, in seconds. */
export const voiceLength = 42;
export const videoLength = 108;

/** Minutes and seconds, as a recorder shows them. */
export const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
