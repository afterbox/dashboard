import type { Relationship } from "./schemas";

/**
 * Words that depend on who the gift is for. The story is written about Mary
 * ("Only she will hear it"); these keep it true for everyone else.
 */

export const relationshipLabels: Record<Relationship, string> = {
  partner: "Partner",
  daughter: "Daughter",
  son: "Son",
  mum: "Mum",
  dad: "Dad",
  sister: "Sister",
  brother: "Brother",
  friend: "Friend",
  "someone-else": "Someone else",
};

type Pronouns = { they: string; them: string; their: string };

const she: Pronouns = { they: "she", them: "her", their: "her" };
const he: Pronouns = { they: "he", them: "him", their: "his" };
const they: Pronouns = { they: "they", them: "them", their: "their" };

/** We only say "she" or "he" where the relationship itself already does. */
export function pronounsFor(relationship: Relationship | null | undefined): Pronouns {
  switch (relationship) {
    case "daughter":
    case "mum":
    case "sister":
      return she;
    case "son":
    case "dad":
    case "brother":
      return he;
    default:
      return they;
  }
}

/** "0:42" */
export function clock(seconds: number) {
  const whole = Math.max(0, Math.round(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

/** Something they might add next: the words on its soft outline, and a name for its envelope. */
export type Idea = { ask: string; envelope: string };

/** Ideas for what to add next, shown as soft dashed outlines on /home. */
export function nextIdeas(name: string, relationship: Relationship): Idea[] {
  const { their } = pronounsFor(relationship);
  const hardDay = { ask: "Something for a hard day?", envelope: `For ${name}, on a hard day` };
  if (relationship === "daughter" || relationship === "son") {
    return [{ ask: `A letter for ${their} wedding day?`, envelope: `For ${name}, on your wedding day` }, hardDay];
  }
  if (relationship === "partner") {
    return [{ ask: "A letter for your anniversary?", envelope: `For ${name}, on our anniversary` }, hardDay];
  }
  return [{ ask: "A memory only you two share?", envelope: `For ${name}, to make you smile` }, hardDay];
}

/** "1 gift", "3 gifts". */
export const giftCount = (count: number) => `${count} ${count === 1 ? "gift" : "gifts"}`;
