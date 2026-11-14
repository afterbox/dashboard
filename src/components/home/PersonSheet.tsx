"use client";

import { useRef, useState } from "react";
import { EnvelopeArt } from "@/components/app/GiftBoxArt";
import { MessageComposer, readyToSeal, resumeComposing, startComposing, toDraft } from "@/components/app/MessageComposer";
import { Button, Notice, Sheet } from "@/components/app/ui";
import { api, errorMessage, type Draft } from "@/lib/api-client";
import type { Gift, Person } from "@/lib/schemas";
import { clock, pronounsFor, type Idea } from "@/lib/words";
import { useDiscardUnsealed, useSealGift, useUnsealed, type Unsealed } from "@/store/gifts";
import { isPending, stableKey } from "@/store/pending";
import { envelopeFront } from "./PersonGifts";

/** Which person's gifts to open, and whether to go straight into making one. */
export type Opening = { personId: string; idea?: Idea };

type Props = {
  opening: Opening | null;
  person: Person | null;
  gifts: Gift[];
  signOff: string | null;
  onClose: () => void;
  /** They want to say how they sign their gifts: that lives in the account sheet. */
  onSignOff: () => void;
};

/**
 * One person's gifts: listen back to your own voice notes, read your own
 * letters, record one again, add another. This is the giver's view only;
 * nothing of what the person themselves will one day see is here.
 *
 * A new gift joins the list the moment it is sent, marked "Sealing…" until
 * the server has it. If it doesn't go through, the composer comes back with
 * what they made still in it (src/store/gifts.ts).
 */
export function PersonSheet({ opening, person, gifts, signOff, onClose, onSignOff }: Props) {
  return (
    <Sheet open={Boolean(opening && person)} onClose={onClose} title={person ? `For ${person.name}` : ""}>
      {opening && person && (
        <PersonGiftsPanel
          // A different person, or a different idea, starts afresh.
          key={`${person.id}-${opening.idea?.ask ?? ""}`}
          person={person}
          gifts={gifts}
          idea={opening.idea}
          signOff={signOff}
          onSignOff={onSignOff}
        />
      )}
    </Sheet>
  );
}

type PanelProps = Pick<Props, "gifts" | "signOff" | "onSignOff"> & { person: Person; idea?: Idea };

/** What is being made: a new gift, one that takes the place of another, or one that didn't get sealed the first time. */
type Making = { replaces?: Gift; envelopeTitle?: string; unsealed?: Unsealed };

function PersonGiftsPanel({ person, gifts, idea, signOff, onSignOff }: PanelProps) {
  const { mutate: seal } = useSealGift();
  const unsealed = useUnsealed(person.id);
  const discard = useDiscardUnsealed();
  const [chosen, setChosen] = useState<Making | null>(idea ? { envelopeTitle: idea.envelope } : null);
  const [sealed, setSealed] = useState<string | null>(null);
  const { they } = pronounsFor(person.relationship);

  // One that didn't get sealed comes back by itself, with what they made still in it.
  const making: Making | null = chosen ?? (unsealed[0] ? { unsealed: unsealed[0], replaces: unsealed[0].replaces } : null);

  if (making) {
    return (
      <Compose
        key={making.unsealed?.id ?? "new"}
        person={person}
        making={making}
        onBack={() => {
          // "Not now" on one that didn't get sealed lets it go.
          if (making.unsealed) discard(making.unsealed.id);
          setChosen(null);
        }}
        onSeal={(draft) => {
          // Straight back to their gifts, where it is already in the list.
          setChosen(null);
          setSealed(null);
          seal(
            { personId: person.id, draft, replaces: making.replaces, retryOf: making.unsealed?.id },
            {
              onSuccess: (gift) =>
                setSealed(
                  `Sealed for ${person.name}. Only ${they} will ${gift.kind === "voice" ? "hear" : "read"} it, when the time comes.`,
                ),
            },
          );
        }}
      />
    );
  }

  return (
    <div>
      {/* The front of the envelope, as it will be handed over. */}
      <div className="flex items-center gap-3">
        <div className="w-14 shrink-0">
          <EnvelopeArt />
        </div>
        <div className="min-w-0">
          <p className="truncate font-note text-note text-ink">{envelopeFront(person.name, signOff)}</p>
          {!signOff && (
            <button
              type="button"
              onClick={onSignOff}
              className="inline-flex min-h-11 items-center text-small text-ink underline decoration-line decoration-2 underline-offset-4"
            >
              Add how you sign your gifts
            </button>
          )}
        </div>
      </div>

      <div className="mt-2 min-h-5.5">
        <Notice tone="calm">{sealed}</Notice>
      </div>

      <ul className="mt-2 divide-y divide-line border-y border-line">
        {gifts.map((gift) => (
          <GiftRow
            key={stableKey(gift.id)}
            gift={gift}
            onAgain={() => setChosen({ replaces: gift, envelopeTitle: gift.envelopeTitle })}
          />
        ))}
        {gifts.length === 0 && (
          <li className="py-4 text-body text-ink-muted">Nothing sealed for {person.name} yet.</li>
        )}
      </ul>

      <Button full onClick={() => setChosen({})} className="mt-6">
        Add another for {person.name}
      </Button>
    </div>
  );
}

function GiftRow({ gift, onAgain }: { gift: Gift; onAgain: () => void }) {
  const voice = gift.kind === "voice";
  // Sent, and not yet answered: it can't be played from the server or replaced until it is there.
  const sealing = isPending(gift.id);
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [reading, setReading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const play = async () => {
    const player = audio.current;
    if (!player) return;
    if (!player.paused) {
      player.pause();
      return;
    }
    setError(null);
    setBusy(true);
    try {
      // The link to a recording only lasts a minute, so a fresh one is asked for each time.
      const { url } = await api.gifts.playback(gift.id);
      player.src = url;
      await player.play();
    } catch (problem) {
      setError(problem instanceof DOMException ? "We couldn't play that just now. Try again?" : errorMessage(problem));
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="py-3" aria-busy={sealing}>
      <div className="flex items-center gap-3">
        {voice ? (
          <button
            type="button"
            onClick={play}
            disabled={busy || sealing}
            aria-label={`${playing ? "Pause" : "Play"} ${gift.envelopeTitle}`}
            className="inline-flex size-12 shrink-0 items-center justify-center rounded-pill border border-ink-muted text-ink transition-colors duration-200 ease-state hover:border-ink disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" aria-hidden className="size-5 fill-current">
              {playing ? <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" /> : <path d="M8 5.5v13l11-6.5z" />}
            </svg>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setReading((open) => !open)}
            aria-expanded={reading}
            aria-label={`${reading ? "Close" : "Read"} ${gift.envelopeTitle}`}
            className="inline-flex size-12 shrink-0 items-center justify-center rounded-pill border border-ink-muted text-ink transition-colors duration-200 ease-state hover:border-ink"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden
              className="size-5 fill-none stroke-current [stroke-linecap:round] [stroke-width:1.5]"
            >
              <path d="M6 8h12M6 12h12M6 16h7" />
            </svg>
          </button>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-note text-note text-pretty text-ink">{gift.envelopeTitle}</p>
          <p className="text-small text-ink-muted">
            {sealing ? "Sealing…" : voice ? `Voice note, ${clock(gift.durationSeconds ?? 0)}` : "A letter"}
          </p>
        </div>
        <button
          type="button"
          onClick={onAgain}
          disabled={sealing}
          className="inline-flex min-h-11 shrink-0 items-center text-small font-semibold text-ink underline decoration-line decoration-2 underline-offset-4 disabled:opacity-50"
        >
          {voice ? "Record again" : "Write again"}
        </button>
      </div>
      {voice && (
        <audio
          ref={audio}
          preload="none"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
        />
      )}
      {reading && gift.letterText && (
        <p className="mt-3 rounded-md border border-line bg-linen p-4 text-body whitespace-pre-wrap text-ink">
          {gift.letterText}
        </p>
      )}
      <Notice>{error}</Notice>
    </li>
  );
}

type ComposeProps = {
  person: Person;
  making: Making;
  onBack: () => void;
  /** Ready: send it to be sealed. */
  onSeal: (draft: Draft) => void;
};

function Compose({ person, making, onBack, onSeal }: ComposeProps) {
  const [composing, setComposing] = useState(() =>
    making.unsealed
      ? resumeComposing(making.unsealed.draft)
      : startComposing(person.name, {
          ...(making.envelopeTitle && { envelopeTitle: making.envelopeTitle }),
          // Writing a letter again starts from the letter.
          ...(making.replaces?.kind === "letter" && { mode: "letter" as const, letterText: making.replaces.letterText ?? "" }),
        }),
  );
  // One that didn't get sealed opens with why.
  const [error, setError] = useState<string | null>(making.unsealed?.message ?? null);

  const seal = () => {
    setError(null);
    const ready = toDraft(composing);
    if ("missing" in ready) {
      setError(ready.missing);
      return;
    }
    onSeal(ready.draft);
  };

  return (
    <div>
      <p className="mb-4 text-body text-ink-muted">
        {making.unsealed
          ? "This one isn't sealed yet. What you made is still here."
          : making.replaces
            ? "This takes the place of the one you sealed before."
            : `Say something to ${person.name}. Something only you could say.`}
      </p>
      <MessageComposer personName={person.name} value={composing} onChange={setComposing} />
      <div className="mt-6 space-y-1">
        <Notice>{error}</Notice>
        {/* Once there is something to seal. */}
        {readyToSeal(composing) && (
          <div className="reveal">
            <Button full onClick={seal}>
              Seal it for {person.name}
            </Button>
          </div>
        )}
        <div className="flex justify-center">
          <Button variant="quiet" onClick={onBack}>
            Not now
          </Button>
        </div>
      </div>
    </div>
  );
}
