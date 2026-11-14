"use client";

import { useState, type FormEvent } from "react";
import { ChoiceRow } from "@/components/app/ChoiceRow";
import { Button, Notice } from "@/components/app/ui";
import { ApiError, errorMessage } from "@/lib/api-client";
import { looksLikeSecret, noNumbersMessage } from "@/lib/no-numbers";
import type { OnboardingState } from "@/lib/schemas";
import { useOnboarding } from "../OnboardingProvider";
import { StepActions, StepFrame } from "../StepFrame";
import { useMoveOn } from "../useMoveOn";

const banks = ["Barclays", "HSBC", "Lloyds", "NatWest", "Santander", "Nationwide", "Monzo", "Starling"] as const;
const other = "Other";
const options = [...banks, other].map((bank) => ({ value: bank, label: bank }));

/**
 * 5. One thing they'd need to find. The name of a bank and nothing more. On a
 * phone, one row of the four most common and "More"; the rest, and a bank of
 * their own, are in its sheet. It lands on a small shelf the moment it is
 * chosen, and is saved once, on Continue. For now this is the last step:
 * Continue, or "Skip for now", leads home.
 */
export function Find({ state }: { state: OnboardingState }) {
  const { save } = useOnboarding();
  const moveOn = useMoveOn("find");
  const saved = state.bank?.providerName ?? null;
  const known = saved !== null && (banks as readonly string[]).includes(saved);
  const [choice, setChoice] = useState<string | null>(saved === null ? null : known ? saved : other);
  const [typed, setTyped] = useState(saved !== null && !known ? saved : "");
  const [busy, setBusy] = useState<"save" | "skip" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const name = choice === other ? typed.trim() : (choice ?? "");
  // A number typed in "Other" never goes on the shelf, even for a moment.
  const shown = name && !looksLikeSecret(name) ? name : null;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!name) {
      setError(choice === other ? "Type the bank's name, or skip for now." : "Choose your bank, or skip for now.");
      return;
    }
    // Said straight away here; the server checks again, and that is the check that counts.
    if (looksLikeSecret(name)) {
      setError(noNumbersMessage);
      return;
    }
    setBusy("save");
    try {
      if (name !== saved) await save("find", { providerName: name });
      await moveOn();
    } catch (problem) {
      const fields = problem instanceof ApiError ? problem.fields : undefined;
      setError(fields?.providerName ?? errorMessage(problem));
      setBusy(null);
    }
  };

  const skip = async () => {
    setError(null);
    setBusy("skip");
    try {
      await save("find", {});
      await moveOn();
    } catch (problem) {
      setError(errorMessage(problem));
      setBusy(null);
    }
  };

  return (
    <StepFrame title="Where does your main bank account live?">
      <form onSubmit={submit} noValidate className="flex flex-1 flex-col">
        <div className="space-y-5">
          <ChoiceRow
            legend="Your main bank"
            hideLegend
            name="bank"
            options={options}
            value={choice}
            onChange={setChoice}
            own={{
              value: other,
              word: typed,
              onWord: setTyped,
              label: "The bank's name",
              placeholder: "The bank's name",
              maxLength: 80,
              // A number typed here is never shown back, on the chip or on the shelf.
              showWord: !looksLikeSecret(typed),
            }}
          />

          {shown && (
            <div>
              <p className="eyebrow text-ink-muted">What they&apos;ll need to find</p>
              {/* shelf */}
              <div className="mt-2 flex items-end gap-2 border-b-2 border-ink px-2">
                <p
                  key={shown}
                  className={`rounded-t-sm border border-b-0 border-line bg-paper px-4 py-2 text-label text-ink ${
                    shown !== saved ? "shelf-item-new" : ""
                  }`}
                >
                  {shown}
                </p>
              </div>
              <p role="status" className="mt-2 text-body text-ink">
                One less thing for them to search for.
              </p>
            </div>
          )}
        </div>

        <StepActions>
          <Notice>{error}</Notice>
          <Button type="submit" full busy={busy === "save"} disabled={busy !== null}>
            Continue
          </Button>
          {!name && !saved && (
            <div className="flex justify-center">
              <Button variant="quiet" busy={busy === "skip"} disabled={busy !== null} onClick={skip}>
                Skip for now
              </Button>
            </div>
          )}
        </StepActions>
      </form>
    </StepFrame>
  );
}
