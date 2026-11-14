"use client";

import { useState, type FormEvent } from "react";
import { Button, Notice, TextField } from "@/components/app/ui";
import { ApiError, errorMessage } from "@/lib/api-client";
import type { Person } from "@/lib/schemas";
import { useOnboarding } from "../OnboardingProvider";
import { StepActions, StepFrame } from "../StepFrame";
import { useMoveOn } from "../useMoveOn";

/**
 * Reaching them. Not shown for now (`setAside` in src/lib/onboarding.ts).
 *
 * Both optional, and "Add later" is exactly as visible as
 * "Save": two buttons, the same size and weight. We never press for someone
 * else's details. Two bare fields that say what they are for, and nothing else.
 */
export function Reach({ person }: { person: Person }) {
  const { save } = useOnboarding();
  const moveOn = useMoveOn("reach");
  const [email, setEmail] = useState(person.email ?? "");
  const [phone, setPhone] = useState(person.phone ?? "");
  const [busy, setBusy] = useState<"save" | "later" | null>(null);
  const [errors, setErrors] = useState<{ email?: string; phone?: string; other?: string }>({});

  const send = async (how: "save" | "later") => {
    setErrors({});
    setBusy(how);
    try {
      // "Add later" sends nothing and changes nothing.
      await save("reach", how === "later" ? {} : { email, phone });
      await moveOn();
    } catch (problem) {
      const fields = problem instanceof ApiError ? problem.fields : undefined;
      setErrors(fields?.email || fields?.phone ? fields : { other: errorMessage(problem) });
      setBusy(null);
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void send("save");
  };

  return (
    <StepFrame title={`When the time comes, how should we reach ${person.name}?`}>
      <form onSubmit={submit} noValidate className="flex flex-1 flex-col">
        <div className="space-y-3">
          <TextField
            label={`${person.name}'s email`}
            hideLabel
            placeholder={`${person.name}'s email (optional)`}
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={errors.email}
            autoComplete="off"
            inputMode="email"
            autoCapitalize="none"
            spellCheck={false}
          />
          <TextField
            label={`${person.name}'s phone`}
            hideLabel
            placeholder={`${person.name}'s phone (optional)`}
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            error={errors.phone}
            autoComplete="off"
            inputMode="tel"
          />
          <p className="pt-1 text-small text-ink-muted">
            We won&apos;t contact {person.name} now. Only when the time comes, and only if you&apos;d like us to.
          </p>
        </div>
        <StepActions>
          <Notice>{errors.other}</Notice>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" full busy={busy === "later"} disabled={busy !== null} onClick={() => send("later")}>
              Add later
            </Button>
            <Button type="submit" variant="outline" full busy={busy === "save"} disabled={busy !== null}>
              Save
            </Button>
          </div>
        </StepActions>
      </form>
    </StepFrame>
  );
}
