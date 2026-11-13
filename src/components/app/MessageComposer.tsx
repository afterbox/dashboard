"use client";

import { useState } from "react";
import type { Draft } from "@/lib/api-client";
import { Recorder, type Recording } from "./Recorder";
import { Button, Suggestion, TextArea, TextField } from "./ui";

/** A message while it is being made: a voice note or a letter, and the name on its envelope. */
export type Composing = {
  mode: "voice" | "letter";
  recording: Recording | null;
  letterText: string;
  envelopeTitle: string;
};

export const startComposing = (personName: string, start: Partial<Composing> = {}): Composing => ({
  mode: "voice",
  recording: null,
  letterText: "",
  envelopeTitle: `For ${personName}`,
  ...start,
});

/** Back to a message that was ready to seal (it didn't go through), exactly as it was. */
export const resumeComposing = (draft: Draft): Composing =>
  draft.kind === "voice"
    ? { mode: "voice", recording: { blob: draft.recording, seconds: draft.seconds }, letterText: "", envelopeTitle: draft.envelopeTitle }
    : { mode: "letter", recording: null, letterText: draft.letterText, envelopeTitle: draft.envelopeTitle };

/** Ready to seal, or the one thing still missing, said kindly. */
export function toDraft(composing: Composing): { draft: Draft } | { missing: string } {
  const envelopeTitle = composing.envelopeTitle.trim();
  if (composing.mode === "voice") {
    if (!composing.recording) return { missing: "Record your voice note first, or write it instead." };
    if (!envelopeTitle) return { missing: "Give the envelope a name." };
    return {
      draft: { kind: "voice", recording: composing.recording.blob, seconds: composing.recording.seconds, envelopeTitle },
    };
  }
  if (!composing.letterText.trim()) return { missing: "Write a few words first." };
  if (!envelopeTitle) return { missing: "Give the envelope a name." };
  return { draft: { kind: "letter", letterText: composing.letterText, envelopeTitle } };
}

/** Ideas to tap, when the page is blank. Each comes with a name for its envelope. */
const prompts = [
  { idea: "Something you've never said out loud", envelope: (name: string) => `For ${name}, for whenever you need me` },
  { idea: "What to remember on a hard day", envelope: (name: string) => `For ${name}, on a hard day` },
  { idea: "A memory only you two share", envelope: (name: string) => `For ${name}, to make you smile` },
];

const envelopeSuggestions = (name: string) => [`For ${name}, on a hard day`, `For ${name}, for whenever you need me`];

type Props = {
  /** Who it is for. */
  personName: string;
  value: Composing;
  onChange: (value: Composing) => void;
};

/**
 * "Say something to Mary. Something only you could say." A voice note (record,
 * stop, play back, record again) or a letter, then a name for the envelope in
 * their own hand. Voice and letters only: no video.
 */
export function MessageComposer({ personName, value, onChange }: Props) {
  const [idea, setIdea] = useState<string | null>(null);
  /** Until they name the envelope themselves, tapping an idea names it for them. */
  const [named, setNamed] = useState(false);
  const set = (change: Partial<Composing>) => onChange({ ...value, ...change });

  const choose = (prompt: (typeof prompts)[number]) => {
    setIdea(prompt.idea);
    if (!named) set({ envelopeTitle: prompt.envelope(personName) });
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-small text-ink-muted">Not sure where to start? Tap an idea.</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {prompts.map((prompt) => (
            <Suggestion key={prompt.idea} aria-pressed={idea === prompt.idea} onClick={() => choose(prompt)}>
              {prompt.idea}
            </Suggestion>
          ))}
        </div>
      </div>

      {value.mode === "voice" ? (
        <div>
          <Recorder
            value={value.recording}
            onChange={(recording) => set({ recording })}
            onUnavailable={() => set({ mode: "letter" })}
          />
          <Button variant="quiet" onClick={() => set({ mode: "letter" })} className="mt-1 -ml-6">
            Write it instead
          </Button>
        </div>
      ) : (
        <div>
          <TextArea
            label={`Your letter to ${personName}`}
            value={value.letterText}
            onChange={(event) => set({ letterText: event.target.value })}
            placeholder={idea ? `${idea}…` : `Dear ${personName},`}
            maxLength={20_000}
          />
          <Button variant="quiet" onClick={() => set({ mode: "voice" })} className="mt-1 -ml-6">
            Record a voice note instead
          </Button>
        </div>
      )}

      <div>
        <TextField
          label="Name the envelope"
          handwritten
          value={value.envelopeTitle}
          onChange={(event) => {
            setNamed(true);
            set({ envelopeTitle: event.target.value });
          }}
          maxLength={80}
          autoComplete="off"
        />
        <div className="mt-2 flex flex-wrap gap-2">
          {envelopeSuggestions(personName).map((suggestion) => (
            <Suggestion
              key={suggestion}
              aria-pressed={value.envelopeTitle === suggestion}
              onClick={() => {
                setNamed(true);
                set({ envelopeTitle: suggestion });
              }}
            >
              {suggestion}
            </Suggestion>
          ))}
        </div>
      </div>
    </div>
  );
}
