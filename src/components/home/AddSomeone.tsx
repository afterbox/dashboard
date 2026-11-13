"use client";

import { useState, type FormEvent } from "react";
import { Offer, offerPromise, paidSoon } from "@/components/app/Offer";
import { Button, Chips, Notice, Sheet, TextField } from "@/components/app/ui";
import { ApiError, errorMessage } from "@/lib/api-client";
import { relationships, type Person, type PlanChoice, type Relationship } from "@/lib/schemas";
import { relationshipLabels } from "@/lib/words";
import { useAddPerson } from "@/store/people";
import { useChoosePlan } from "@/store/session";

const options = relationships.map((value) => ({ value, label: relationshipLabels[value] }));

type Props = { people: Person[] };

/**
 * "Add someone you love": a soft outline where the next box would go.
 *
 * The free plan is one person. Asking for a second opens the warm offer, the
 * same two equal choices as in onboarding: never an error, never a wall, and
 * nothing already made is ever taken away because of the plan.
 */
export function AddSomeone({ people }: Props) {
  const [sheet, setSheet] = useState<"person" | "offer" | null>(null);
  const first = people[0];

  return (
    <>
      <button
        type="button"
        // Someone is already here: on the free plan the next one is the offer. (The server decides; this saves a round trip.)
        onClick={() => setSheet(first ? "offer" : "person")}
        className="flex min-h-24 w-full items-center justify-center rounded-lg border border-dashed border-ink-muted px-6 py-5 text-label text-ink transition-colors duration-200 ease-state hover:border-ink md:max-w-md"
      >
        Add someone you love
      </button>

      <Sheet open={sheet === "person"} onClose={() => setSheet(null)} title="Who came to mind?">
        <NewPerson onAdded={() => setSheet(null)} onOffer={() => setSheet("offer")} />
      </Sheet>

      <Sheet
        open={sheet === "offer"}
        onClose={() => setSheet(null)}
        title={first ? `Who else would you build one for?` : "Build gifts for everyone"}
      >
        <SecondPersonOffer first={first} onDone={() => setSheet(null)} />
      </Sheet>
    </>
  );
}

function SecondPersonOffer({ first, onDone }: { first: Person | undefined; onDone: () => void }) {
  const { mutateAsync: choosePlan } = useChoosePlan();
  const [chosen, setChosen] = useState<PlanChoice | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const choose = async (choice: PlanChoice) => {
    setBusy(true);
    setError(null);
    try {
      await choosePlan(choice);
      setChosen(choice);
      if (choice === "free") onDone();
    } catch (problem) {
      setError(errorMessage(problem));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <p className="mb-4 text-body text-ink-muted">
        {first
          ? `${first.name}'s gift is free, and always will be. Gifts for everyone else you love come with the paid plan.`
          : "One person's gift is free, and always will be. Gifts for everyone else you love come with the paid plan."}
      </p>
      <Offer chosen={chosen} onChoose={choose} disabled={busy} freeLabel="Keep going free" />
      {first && <p className="mt-4 text-body text-ink">{offerPromise(first.name, first.relationship)}</p>}
      <div className="mt-3 space-y-3">
        <Notice>{error}</Notice>
        {chosen === "paid_interest" && (
          <>
            <Notice tone="calm">{paidSoon}</Notice>
            <Button variant="outline" onClick={onDone}>
              Back to your gifts
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function NewPerson({ onAdded, onOffer }: { onAdded: () => void; onOffer: () => void }) {
  const { mutateAsync: addPerson } = useAddPerson();
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState<Relationship | null>(null);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; other?: string }>({});
  const shown = name.trim();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!shown) return setErrors({ name: "Tell us their name." });
    if (!relationship) return setErrors({ other: "Choose how they're related." });
    setErrors({});
    setBusy(true);
    try {
      await addPerson({ name: shown, relationship });
      onAdded();
    } catch (problem) {
      setBusy(false);
      // The free plan is one person: the offer, not an error.
      if (problem instanceof ApiError && problem.code === "upgrade_required") return onOffer();
      const fields = problem instanceof ApiError ? problem.fields : undefined;
      setErrors(fields?.name ? { name: fields.name } : { other: errorMessage(problem) });
    }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <TextField
        label="Their name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        error={errors.name}
        maxLength={60}
        autoComplete="off"
        autoCapitalize="words"
      />
      <Chips legend="How they're related" showLegend name="new-relationship" options={options} value={relationship} onChange={setRelationship} />
      <div className="space-y-1">
        <Notice>{errors.other}</Notice>
        <Button type="submit" full busy={busy}>
          {shown ? `This is for ${shown}` : "This is for them"}
        </Button>
      </div>
    </form>
  );
}
