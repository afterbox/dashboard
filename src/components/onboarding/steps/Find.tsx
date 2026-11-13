"use client";

import { useState, type FormEvent } from "react";
import { Button, Chips, Notice, TextField } from "@/components/app/ui";
import { ApiError, errorMessage } from "@/lib/api-client";
import { looksLikeSecret, noNumbersMessage } from "@/lib/no-numbers";
import type { OnboardingState } from "@/lib/schemas";
import { useOnboarding } from "../OnboardingProvider";
import { StepActions, StepFrame } from "../StepFrame";

const banks = ["Barclays", "HSBC", "Lloyds", "NatWest", "Santander", "Nationwide", "Monzo", "Starling"] as const;
const other = "Other";
const options = [...banks, other].map((bank) => ({ value: bank, label: bank }));

/**
 * 5. One thing they'd need to find. The name of a bank and nothing more:
 * never a number, never a password. It lands on a small shelf.
 */
export function Find({ state }: { state: OnboardingState }) {
  const { save, go } = useOnboarding();
  const saved = state.bank?.providerName ?? null;
  const known = saved !== null && (banks as readonly string[]).includes(saved);
  const [choice, setChoice] = useState<string | null>(saved === null ? null : known ? saved : other);
  const [typed, setTyped] = useState(saved !== null && !known ? saved : "");
  const [busy, setBusy] = useState<"save" | "skip" | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** It has just landed: the shelf shows it arriving. */
  const [landed, setLanded] = useState(false);

  const name = choice === other ? typed.trim() : (choice ?? "");
  const unchanged = saved !== null && name === saved;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (unchanged) {
      go("nudges", "find");
      return;
    }
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
      await save("find", { providerName: name });
      setLanded(true);
    } catch (problem) {
      const fields = problem instanceof ApiError ? problem.fields : undefined;
      setError(fields?.providerName ?? errorMessage(problem));
    } finally {
      setBusy(null);
    }
  };

  const skip = async () => {
    setError(null);
    setBusy("skip");
    try {
      await save("find", {});
      go("nudges", "find");
    } catch (problem) {
      setError(errorMessage(problem));
      setBusy(null);
    }
  };

  return (
    <StepFrame title="Where does your main bank account live?" lede="Just the name. Never numbers or passwords.">
      <form onSubmit={submit} noValidate className="flex flex-1 flex-col">
        <div className="space-y-5">
          <Chips legend="Your main bank" name="bank" options={options} value={choice} onChange={setChoice} />
          {choice === other && (
            <TextField
              label="The bank's name"
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              maxLength={80}
              autoComplete="off"
            />
          )}

          {saved && (
            <div>
              <p className="eyebrow text-ink-muted">What they&apos;ll need to find</p>
              {/* shelf */}
              <div className="mt-2 flex items-end gap-2 border-b-2 border-ink px-2">
                <p
                  key={saved}
                  className={`rounded-t-sm border border-b-0 border-line bg-paper px-4 py-2 text-label text-ink ${
                    landed ? "shelf-item-new" : ""
                  }`}
                >
                  {saved}
                </p>
              </div>
              <p role="status" className="mt-3 text-body text-ink">
                One less thing for them to search for.
              </p>
            </div>
          )}
        </div>

        <StepActions>
          <Notice>{error}</Notice>
          <Button type="submit" full busy={busy === "save"} disabled={busy !== null}>
            {unchanged ? "Continue" : name ? `Add ${name}` : "Add it"}
          </Button>
          {!saved && (
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
