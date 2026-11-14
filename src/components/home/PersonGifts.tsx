"use client";

import { GiftBox } from "@/components/app/GiftBox";
import { EnvelopeArt } from "@/components/app/GiftBoxArt";
import type { Gift, Person } from "@/lib/schemas";
import { giftCount, nextIdeas, relationshipWord, type Idea } from "@/lib/words";
import { useUnsealed } from "@/store/gifts";
import { stableKey } from "@/store/pending";

type Props = {
  person: Person;
  gifts: Gift[];
  /** How they sign their gifts ("Dad"), once they've said. */
  signOff: string | null;
  travels: boolean;
  /** Open this person's gifts; with an idea, straight into making it. */
  onOpen: (start?: { idea?: Idea }) => void;
};

/** "For Mary, from Dad": what is written on the front, as they will see it. */
export const envelopeFront = (name: string, signOff: string | null) =>
  signOff ? `For ${name}, from ${signOff}` : `For ${name}`;

/**
 * One person, as a gift box: their name on the handwritten tag, a ring for
 * each gift, the sealed envelopes inside, and soft dashed outlines for what
 * might come next. Tapping the box opens their gifts.
 */
export function PersonGifts({ person, gifts, signOff, travels, onOpen }: Props) {
  const ideas = nextIdeas(person.name, person.relationship).filter(
    (idea) => !gifts.some((gift) => gift.envelopeTitle === idea.envelope),
  );
  // "Mary, daughter", or just "Mary" when they haven't said how they're related.
  const word = relationshipWord(person);
  const who = word ? `${person.name}, ${word.toLowerCase()}` : person.name;
  // Something they made for this person that didn't get sealed. It is still here.
  const unsealed = useUnsealed(person.id);

  return (
    <article className="grid gap-4 md:grid-cols-[auto_1fr] md:items-center md:gap-12">
      <button
        type="button"
        onClick={() => onOpen()}
        aria-label={`${who}: ${giftCount(gifts.length)}. Open ${person.name}'s gifts`}
        className="justify-self-center rounded-xl"
      >
        <GiftBox name={person.name} rings={gifts.length} size="shelf" travels={travels} />
      </button>

      <div className="min-w-0">
        {/* The envelope, as it will be handed over. */}
        <div className="flex items-center gap-3">
          <div className="w-12 shrink-0">
            <EnvelopeArt />
          </div>
          <p className="min-w-0">
            <span className="block truncate font-note text-note text-ink">{envelopeFront(person.name, signOff)}</span>
            <span className="block text-small text-ink-muted">
              {giftCount(gifts.length)} inside, sealed until the time comes
            </span>
          </p>
        </div>

        <ul className="mt-4 flex flex-wrap gap-2">
          {gifts.map((gift) => (
            <li key={stableKey(gift.id)}>
              <button
                type="button"
                onClick={() => onOpen()}
                className="inline-flex min-h-11 max-w-full items-center gap-2 rounded-md border border-line bg-paper px-3 py-1.5 text-left text-small text-ink"
              >
                <span className="w-6 shrink-0">
                  <EnvelopeArt />
                </span>
                <span className="truncate">{gift.envelopeTitle}</span>
              </button>
            </li>
          ))}
          {ideas.map((idea) => (
            <li key={idea.ask}>
              <button
                type="button"
                onClick={() => onOpen({ idea })}
                className="inline-flex min-h-11 items-center rounded-md border border-dashed border-ink-muted px-3 py-1.5 text-left text-small text-ink-muted transition-colors duration-200 ease-state hover:border-ink hover:text-ink"
              >
                {idea.ask}
              </button>
            </li>
          ))}
        </ul>

        {unsealed.length > 0 && (
          <div role="alert" className="mt-2">
            <button
              type="button"
              onClick={() => onOpen()}
              className="inline-flex min-h-11 items-center text-left text-small text-alert underline decoration-2 underline-offset-4"
            >
              {unsealed.length === 1
                ? `“${unsealed[0].draft.envelopeTitle}” isn't sealed yet. It's still here. Try again`
                : `${unsealed.length} messages for ${person.name} aren't sealed yet. They're still here. Try again`}
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
