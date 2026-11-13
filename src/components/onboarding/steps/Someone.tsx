"use client";

import { useEffect, useState, useSyncExternalStore, type FormEvent } from "react";
import { Button, Chips, Notice, TextField } from "@/components/app/ui";
import { ApiError, errorMessage } from "@/lib/api-client";
import { relationships, type OnboardingState, type Person, type Relationship } from "@/lib/schemas";
import { relationshipLabels } from "@/lib/words";
import { useOnboarding } from "../OnboardingProvider";
import { StepActions, StepFrame } from "../StepFrame";

const options = relationships.map((value) => ({ value, label: relationshipLabels[value] }));

/**
 * 1. Who came to mind? The first screen: the landing page has already said
 * what this is. A name and how they're related, nothing else about them yet.
 * As the name is typed it appears on the box's handwritten tag, and the first
 * ring grows round it.
 *
 * The question is asked at once, before anything has loaded. Answering it
 * starts a guest session, so everything from here on is kept, and nobody is
 * asked who they are until they have made something.
 */
export function Someone({ state }: { state: OnboardingState | null }) {
  return (
    <StepFrame title="Think of someone you love. Who came to mind first?">
      <SomeoneForm person={state?.person ?? null} />
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

function SomeoneForm({ person }: { person: Person | null }) {
  const { begin, save, go, setDraftName } = useOnboarding();
  const awake = useAwake();
  const [name, setName] = useState(person?.name ?? "");
  const [relationship, setRelationship] = useState<Relationship | null>(person?.relationship ?? null);
  const [busy, setBusy] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const shown = name.trim();

  // Someone coming back to change the name: who they named arrives a moment
  // after the question does. It fills the form, unless they have already begun to answer.
  const [known, setKnown] = useState(person?.id ?? null);
  if (person && person.id !== known) {
    setKnown(person.id);
    if (!name && !relationship) {
      setName(person.name);
      setRelationship(person.relationship);
    }
  }

  // The tag on the box follows the field while this screen is up.
  useEffect(() => {
    setDraftName(shown);
    return () => setDraftName(null);
  }, [shown, setDraftName]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setNameError(null);
    setError(null);
    if (!shown) {
      setNameError("Tell us their name.");
      return;
    }
    if (!relationship) {
      setError("Choose how they're related.");
      return;
    }
    setBusy(true);
    try {
      // A guest session, if they have none yet. Harmless if they do.
      await begin();
      await save("someone", { name: shown, relationship });
      go("message", "someone");
    } catch (problem) {
      const fields = problem instanceof ApiError ? problem.fields : undefined;
      if (fields?.name) setNameError(fields.name);
      else setError(errorMessage(problem));
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-1 flex-col">
      <fieldset disabled={!awake} className="min-w-0 space-y-6">
        <TextField
          label="Their name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={nameError}
          maxLength={60}
          autoComplete="off"
          autoCapitalize="words"
          enterKeyHint="done"
        />
        <Chips
          legend="How they're related"
          showLegend
          name="relationship"
          options={options}
          value={relationship}
          onChange={setRelationship}
        />
      </fieldset>
      <StepActions>
        <Notice>{error}</Notice>
        {/* Not a submit button until the form can answer: before that, the browser would send it itself. */}
        <Button type={awake ? "submit" : "button"} full busy={busy}>
          {shown ? `This is for ${shown}` : "This is for them"}
        </Button>
      </StepActions>
    </form>
  );
}
