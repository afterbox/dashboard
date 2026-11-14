"use client";

import { useState } from "react";
import { EnvelopeArt } from "@/components/app/GiftBoxArt";
import { MessageComposer, readyToSeal, startComposing, toDraft } from "@/components/app/MessageComposer";
import { AgainIcon, PencilIcon } from "@/components/app/icons";
import { Button, IconButton, Notice } from "@/components/app/ui";
import { errorMessage, prepareMessage } from "@/lib/api-client";
import { nextStep, signUpStep } from "@/lib/onboarding";
import type { Gift, OnboardingState, Person } from "@/lib/schemas";
import { clock, pronounsFor } from "@/lib/words";
import { useOnboarding } from "../OnboardingProvider";
import { StepActions, StepFrame } from "../StepFrame";

/**
 * 2. Say something to them. It opens on the question, one big record button
 * and "Write instead", and nothing else. The envelope, already addressed "For
 * Mary", and "Seal it" arrive once there is something to seal. Sealing it is
 * the first reward: the envelope drops into the box, a new ring grows, the box
 * glows once.
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
    <StepFrame title={`Say something to ${person.name}.`} lede="Something only you could say.">
      <MessageComposer personName={person.name} value={composing} onChange={setComposing} />
      {readyToSeal(composing) && (
        <StepActions>
          <Notice>{error}</Notice>
          <div className="reveal">
            <Button full busy={busy} onClick={seal}>
              Seal it for {person.name}
            </Button>
          </div>
        </StepActions>
      )}
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
      <div className="flex items-center gap-3">
        <div className="w-12 shrink-0">
          <EnvelopeArt />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-note text-note text-pretty text-ink">{gift.envelopeTitle}</p>
          <p className="text-small text-ink-muted">
            {voice ? `Voice note, ${clock(gift.durationSeconds ?? 0)}` : "A letter"}
          </p>
        </div>
        <IconButton label={voice ? "Record it again" : "Write it again"} tip="left" onClick={onAgain}>
          {voice ? <AgainIcon /> : <PencilIcon />}
        </IconButton>
      </div>
      <StepActions>
        {/* A guest keeps it safe next. Someone already signed in has nothing to do there. */}
        <Button full onClick={() => go(guest ? signUpStep : (nextStep(signUpStep) ?? signUpStep), "message")}>
          Continue
        </Button>
      </StepActions>
    </StepFrame>
  );
}
