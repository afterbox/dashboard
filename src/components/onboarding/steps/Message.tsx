"use client";

import { useState } from "react";
import { EnvelopeArt } from "@/components/app/GiftBoxArt";
import { MessageComposer, startComposing, toDraft } from "@/components/app/MessageComposer";
import { Button, Notice } from "@/components/app/ui";
import { errorMessage, prepareMessage } from "@/lib/api-client";
import type { Gift, OnboardingState, Person } from "@/lib/schemas";
import { clock, pronounsFor } from "@/lib/words";
import { useOnboarding } from "../OnboardingProvider";
import { StepActions, StepFrame } from "../StepFrame";

/**
 * 2. Say something to them. A voice note or a letter, in an envelope they
 * name. Sealing it is the first reward: the envelope drops into the box, a
 * new ring grows, the box glows once.
 */
export function Message({ state, person }: { state: OnboardingState; person: Person }) {
  const [again, setAgain] = useState(false);
  if (state.gift && !again) {
    return <Sealed key="sealed" gift={state.gift} person={person} guest={state.user?.isGuest ?? true} onAgain={() => setAgain(true)} />;
  }
  return <Compose key="compose" person={person} onSealed={() => setAgain(false)} />;
}

function Compose({ person, onSealed }: { person: Person; onSealed: () => void }) {
  const { save, celebrate } = useOnboarding();
  const [composing, setComposing] = useState(() => startComposing(person.name));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const seal = async () => {
    setError(null);
    const ready = toDraft(composing);
    if ("missing" in ready) {
      setError(ready.missing);
      return;
    }
    setBusy(true);
    try {
      await save("message", await prepareMessage(ready.draft));
      celebrate();
      onSealed();
    } catch (problem) {
      setError(errorMessage(problem));
      setBusy(false);
    }
  };

  return (
    <StepFrame title={`Say something to ${person.name}. Something only you could say.`}>
      <MessageComposer personName={person.name} value={composing} onChange={setComposing} />
      <StepActions>
        <Notice>{error}</Notice>
        <Button full busy={busy} onClick={seal}>
          Seal it for {person.name}
        </Button>
      </StepActions>
    </StepFrame>
  );
}

type SealedProps = { gift: Gift; person: Person; guest: boolean; onAgain: () => void };

function Sealed({ gift, person, guest, onAgain }: SealedProps) {
  const { go } = useOnboarding();
  const { they } = pronounsFor(person.relationship);
  const voice = gift.kind === "voice";

  return (
    <StepFrame
      title={`Sealed for ${person.name}.`}
      lede={`Only ${they} will ${voice ? "hear" : "read"} it, when the time comes.`}
    >
      <div className="flex items-center gap-4 rounded-lg border border-line bg-paper p-4">
        <div className="w-16 shrink-0">
          <EnvelopeArt />
        </div>
        <div className="min-w-0">
          <p className="font-note text-note text-ink">{gift.envelopeTitle}</p>
          <p className="text-small text-ink-muted">
            {voice ? `Voice note, ${clock(gift.durationSeconds ?? 0)}` : "A letter"}
          </p>
        </div>
      </div>
      <Button variant="quiet" onClick={onAgain} className="-ml-6 self-start">
        {voice ? "Record it again" : "Write it again"}
      </Button>
      <StepActions>
        {/* A guest keeps it safe next. Someone already signed in has nothing to do there. */}
        <Button full onClick={() => go(guest ? "keep-safe" : "reach", "message")}>
          Continue
        </Button>
      </StepActions>
    </StepFrame>
  );
}
