"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type FormEvent, type KeyboardEvent } from "react";
import { ChoiceRow } from "@/components/app/ChoiceRow";
import { Button, Notice, TextField } from "@/components/app/ui";
import { ApiError, errorMessage } from "@/lib/api-client";
import { relationships, type OnboardingState, type Person, type Relationship } from "@/lib/schemas";
import { relationshipLabels } from "@/lib/words";
import { useOnboarding } from "../OnboardingProvider";
import { StepActions, StepFrame } from "../StepFrame";

/** In the story's order: the four most common first, which is what the row shows on a phone. The rest are behind "More". */
const options = relationships.map((value) => ({ value, label: relationshipLabels[value] }));
const someoneElse: Relationship = "someone-else";

/**
 * 1. Who came to mind? The first screen: the landing page has already said
 * what this is. It opens with almost nothing on it: the question and one field
 * for a name. As the name is typed it appears on the box's handwritten tag,
 * the first ring grows round it, and one line slides in underneath, "Mary is
 * your…", with a few chips. Saying how they're related is optional; a name is
 * enough.
 *
 * The question is asked at once, before anything has loaded. Answering it
 * starts a guest session, so everything from here on is kept, and nobody is
 * asked who they are until they have made something.
 */
export function Someone({ state }: { state: OnboardingState | null }) {
  const question = useId();
  return (
    // The field takes focus itself, so the keyboard is up and waiting.
    <StepFrame title="Think of someone you love. Who came to mind first?" titleId={question} focus="none">
      <SomeoneForm person={state?.person ?? null} question={question} />
    </StepFrame>
  );
}

const never = () => () => {};

/**
 * False in the page as it is sent, true once it is running in the browser.
 *
 * This is the one screen whose fields are in the page before React has taken
 * it over. A letter typed in that moment can be dropped, and the field wiped
 * with it, so the fields wait: they can't be typed in until they will be heard.
 * Arriving from the landing page there is no such moment, and no wait.
 */
const useAwake = () =>
  useSyncExternalStore(
    never,
    () => true,
    () => false,
  );

function SomeoneForm({ person, question }: { person: Person | null; question: string }) {
  const { begin, save, go, setDraftName } = useOnboarding();
  const awake = useAwake();
  const fields = useRef<HTMLFieldSetElement>(null);
  const [name, setName] = useState(person?.name ?? "");
  const [relationship, setRelationship] = useState<Relationship | null>(person?.relationship ?? null);
  /** Their own word for it, beside "someone else": "Godmother". */
  const [ownWord, setOwnWord] = useState(person?.relationshipLabel ?? "");
  const [busy, setBusy] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const shown = name.trim();

  // Someone coming back to change the name: who they named arrives a moment
  // after the question does. It fills the form, unless they have already begun to answer.
  const [known, setKnown] = useState(person?.id ?? null);
  const [filledIn, setFilledIn] = useState(false);
  if (person && person.id !== known) {
    setKnown(person.id);
    if (!name && !relationship) {
      setName(person.name);
      setRelationship(person.relationship);
      setOwnWord(person.relationshipLabel ?? "");
      setFilledIn(true);
    }
  }

  // The tag on the box follows the field while this screen is up.
  useEffect(() => {
    setDraftName(shown);
    return () => setDraftName(null);
  }, [shown, setDraftName]);

  // Nothing typed yet: straight into the field. Coming back to a name already
  // there: the question, as on every other screen, and no keyboard in the way.
  useEffect(() => {
    if (!awake) return;
    const field = fields.current?.querySelector("input");
    if (field && !field.value) field.focus({ preventScroll: true });
    else document.getElementById(question)?.focus({ preventScroll: true });
  }, [awake, question]);

  // The name they gave before has just arrived in a field we had made ready: back to the question.
  useEffect(() => {
    if (!filledIn) return;
    const active = document.activeElement;
    if (!active || active === document.body || fields.current?.contains(active)) {
      document.getElementById(question)?.focus({ preventScroll: true });
    }
  }, [filledIn, question]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setNameError(null);
    setError(null);
    if (!shown) {
      setNameError("Tell us their name.");
      return;
    }
    setBusy(true);
    try {
      // A guest session, if they have none yet. Harmless if they do.
      await begin();
      await save("someone", {
        name: shown,
        relationship,
        relationshipLabel: relationship === someoneElse ? ownWord.trim() || null : null,
      });
      go("message", "someone");
    } catch (problem) {
      const refused = problem instanceof ApiError ? problem.fields : undefined;
      if (refused?.name) setNameError(refused.name);
      else setError(errorMessage(problem));
      setBusy(false);
    }
  };

  // On a phone the keyboard covers what the name has just revealed. Its "done"
  // key puts the keyboard away, so the chips and the button can be seen, rather than moving on past them.
  const done = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter" || !window.matchMedia("(pointer: coarse)").matches) return;
    event.preventDefault();
    event.currentTarget.blur();
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-1 flex-col">
      <fieldset ref={fields} disabled={!awake} className="min-w-0">
        <TextField
          label="Their name"
          hideLabel
          inviting
          placeholder="Their name"
          aria-describedby={question}
          value={name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={done}
          error={nameError}
          maxLength={60}
          autoComplete="off"
          autoCapitalize="words"
          enterKeyHint="done"
        />

        {/* Only once there is a name. Optional: the button works without it. */}
        {shown && (
          <div className="reveal mt-4 short:mt-3">
            <ChoiceRow
              legend={`${shown} is your…`}
              name="relationship"
              options={options}
              value={relationship}
              onChange={setRelationship}
              optional
              own={{
                value: someoneElse,
                word: ownWord,
                onWord: setOwnWord,
                label: `Who ${shown} is to you, in your words`,
                placeholder: "Godmother, neighbour…",
              }}
            />
          </div>
        )}
      </fieldset>

      {shown && (
        <StepActions>
          <Notice>{error}</Notice>
          <div className="reveal">
            {/* Not a submit button until the form can answer: before that, the browser would send it itself. */}
            <Button type={awake ? "submit" : "button"} full busy={busy}>
              This is for {shown}
            </Button>
          </div>
        </StepActions>
      )}
    </form>
  );
}
