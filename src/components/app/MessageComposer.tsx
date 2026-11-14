"use client";

import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import type { Draft } from "@/lib/api-client";
import { EnvelopeArt } from "./GiftBoxArt";
import { CheckIcon, IdeaIcon, MicIcon, PencilIcon } from "./icons";
import { Recorder, type Recording } from "./Recorder";
import { IconButton, LinkButton, Sheet, Suggestion, TextArea } from "./ui";

/** A message while it is being made: a voice note or a letter, and the name on its envelope. */
export type Composing = {
  mode: "voice" | "letter";
  recording: Recording | null;
  letterText: string;
  envelopeTitle: string;
};

/** What an envelope says until they name it themselves. */
const plainEnvelope = (personName: string) => `For ${personName}`;

export const startComposing = (personName: string, start: Partial<Composing> = {}): Composing => ({
  mode: "voice",
  recording: null,
  letterText: "",
  envelopeTitle: plainEnvelope(personName),
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
    if (!composing.recording) return { missing: "Record your voice note first, or write instead." };
    if (!envelopeTitle) return { missing: "Give the envelope a name." };
    return {
      draft: { kind: "voice", recording: composing.recording.blob, seconds: composing.recording.seconds, envelopeTitle },
    };
  }
  if (!composing.letterText.trim()) return { missing: "Write a few words first." };
  if (!envelopeTitle) return { missing: "Give the envelope a name." };
  return { draft: { kind: "letter", letterText: composing.letterText, envelopeTitle } };
}

/** There is something to seal: the moment the envelope and "Seal it" appear. */
export const readyToSeal = (composing: Composing) => "draft" in toDraft(composing);

/** Ideas to tap, when the page is blank. Each comes with a name for its envelope. */
const prompts = [
  { idea: "Something you've never said out loud", envelope: (name: string) => `For ${name}, for whenever you need me` },
  { idea: "What to remember on a hard day", envelope: (name: string) => `For ${name}, on a hard day` },
  { idea: "A memory only you two share", envelope: (name: string) => `For ${name}, to make you smile` },
];

type Props = {
  /** Who it is for. */
  personName: string;
  value: Composing;
  onChange: (value: Composing) => void;
};

/**
 * "Say something to Mary." A voice note or a letter, in an envelope with their
 * name on it. Voice and letters only: no video.
 *
 * It shows only what is needed now. To begin with, the record button, "Write
 * instead" and "Need an idea?", and nothing else. The ideas wait in a sheet.
 * The envelope appears once there is something to put in it; its tag already
 * says "For Mary", and can be renamed, but never has to be. Whoever uses this
 * shows "Seal it" from the same moment (`readyToSeal`).
 */
export function MessageComposer({ personName, value, onChange }: Props) {
  const [idea, setIdea] = useState<string | null>(null);
  const [ideasOpen, setIdeasOpen] = useState(false);
  /** Until they name the envelope themselves, picking an idea names it for them. */
  const [named, setNamed] = useState(value.envelopeTitle !== plainEnvelope(personName));
  /** They chose to write just now: the page is ready under their thumbs. */
  const [toWriting, setToWriting] = useState(false);
  const set = (change: Partial<Composing>) => onChange({ ...value, ...change });

  const choose = (prompt: (typeof prompts)[number]) => {
    setIdea(prompt.idea);
    if (!named) set({ envelopeTitle: prompt.envelope(personName) });
    setIdeasOpen(false);
  };

  const ideas = (
    <LinkButton icon={<IdeaIcon />} aria-haspopup="dialog" onClick={() => setIdeasOpen(true)}>
      {idea ? "Another idea" : "Need an idea?"}
    </LinkButton>
  );

  return (
    <div>
      {value.mode === "voice" ? (
        <Recorder
          value={value.recording}
          onChange={(recording) => set({ recording })}
          prompt={idea}
          resting={
            <>
              <div className="flex flex-wrap justify-center gap-x-6">
                <LinkButton
                  icon={<PencilIcon />}
                  onClick={() => {
                    setToWriting(true);
                    set({ mode: "letter" });
                  }}
                >
                  Write instead
                </LinkButton>
                {ideas}
              </div>
              {/* Only an idea they asked for is ever on the screen. */}
              {idea && <p className="text-center text-small text-pretty text-ink-muted">{idea}</p>}
            </>
          }
        />
      ) : (
        <div>
          <TextArea
            label={`Your letter to ${personName}`}
            hideLabel
            grows
            value={value.letterText}
            onChange={(event) => set({ letterText: event.target.value })}
            placeholder={idea ? `${idea}…` : `Dear ${personName},`}
            maxLength={20_000}
            autoFocus={toWriting}
          />
          <div className="flex flex-wrap justify-between gap-x-6">
            <LinkButton icon={<MicIcon />} onClick={() => set({ mode: "voice" })}>
              Record instead
            </LinkButton>
            {ideas}
          </div>
        </div>
      )}

      {readyToSeal(value) && (
        <EnvelopeTag
          title={value.envelopeTitle}
          plain={plainEnvelope(personName)}
          onRename={(envelopeTitle) => {
            setNamed(true);
            set({ envelopeTitle });
          }}
        />
      )}

      <Sheet open={ideasOpen} onClose={() => setIdeasOpen(false)} title="Need an idea?">
        <div className="flex flex-col items-start gap-3 md:gap-2">
          {prompts.map((prompt) => (
            <Suggestion key={prompt.idea} aria-pressed={idea === prompt.idea} onClick={() => choose(prompt)}>
              {prompt.idea}
            </Suggestion>
          ))}
        </div>
      </Sheet>
    </div>
  );
}

type TagProps = {
  title: string;
  /** What it goes back to if the name is rubbed out: "For Mary". */
  plain: string;
  onRename: (title: string) => void;
};

/**
 * The envelope, with its handwritten tag: "For Mary". The small pencil renames
 * it in place. Naming it is optional, so there is never a field for it up front.
 */
function EnvelopeTag({ title, plain, onRename }: TagProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);
  const dropped = useRef(false);

  const begin = () => {
    dropped.current = false;
    setDraft(title);
    setEditing(true);
  };
  const keep = () => {
    if (dropped.current) return;
    onRename(draft.trim() || plain);
    setEditing(false);
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    keep();
  };
  // Escape leaves the name as it was (and is kept from closing a sheet this sits in).
  const escape = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    event.stopPropagation();
    dropped.current = true;
    setEditing(false);
  };

  return (
    <div className="reveal mt-3 flex min-h-11 items-center gap-3 short:mt-2">
      {/* On a phone the envelope steps aside while it is renamed, so the whole name can be seen as it is typed. */}
      <div className={`w-12 shrink-0 ${editing ? "max-md:hidden" : ""}`}>
        <EnvelopeArt />
      </div>
      {editing ? (
        <form onSubmit={submit} noValidate className="flex min-w-0 flex-1 items-center gap-1">
          <input
            aria-label="Name on the envelope"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onFocus={(event) => event.currentTarget.select()}
            onBlur={keep}
            onKeyDown={escape}
            maxLength={80}
            autoComplete="off"
            enterKeyHint="done"
            autoFocus
            className="h-11 min-w-0 flex-1 rounded-sm border border-ink-muted bg-paper px-3 font-note text-note text-ink"
          />
          <IconButton type="submit" label="Keep this name">
            <CheckIcon />
          </IconButton>
        </form>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-1">
          {/* tag */}
          <p className="line-clamp-2 min-w-0 -rotate-2 rounded-sm border border-line bg-paper px-3 py-0.5 font-note text-note text-ink shadow-rest">
            {title}
          </p>
          <IconButton label="Rename the envelope" onClick={begin}>
            <PencilIcon />
          </IconButton>
        </div>
      )}
    </div>
  );
}
