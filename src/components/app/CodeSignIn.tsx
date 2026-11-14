"use client";

import { useEffect, useRef, useState, type ComponentType, type FormEvent, type ReactNode } from "react";
import { api, errorMessage } from "@/lib/api-client";
import { AgainIcon, PencilIcon } from "./icons";
import { Button, LinkButton, Notice, TextField } from "./ui";

type Props = {
  /** Google is only offered once it has been set up (the server says so). */
  googleEnabled: boolean;
  /** Where Google sends them back to. */
  returnTo: string;
  /** Signed in. Anything a guest made has moved to the account by now. */
  onSignedIn: () => void | Promise<void>;
  /** The words on the last button: "Keep it safe" in onboarding, "Sign in" for someone returning. */
  finishLabel: string;
  /** Shown under the email field, above the button: the trust lines. Once the code is asked for, nothing else is. */
  children?: ReactNode;
  /** Where the buttons sit: onboarding pins them to the bottom of a phone. */
  Actions?: ComponentType<{ children: ReactNode }>;
};

const Inline = ({ children }: { children: ReactNode }) => <div className="mt-6 space-y-2">{children}</div>;

/**
 * Email, then the 6-digit code we send to it. No password to make up, and none
 * for us to keep. The same two screens sign someone up and sign them back in.
 */
export function CodeSignIn({ googleEnabled, returnTo, onSignedIn, finishLabel, children, Actions = Inline }: Props) {
  const [stage, setStage] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const codeField = useRef<HTMLDivElement>(null);

  const attempt = async (work: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    setNote(null);
    try {
      await work();
    } catch (problem) {
      setError(errorMessage(problem));
    } finally {
      setBusy(false);
    }
  };

  const sendCode = (event?: FormEvent) => {
    event?.preventDefault();
    const address = email.trim();
    if (!address) {
      setError("Add your email address first.");
      return;
    }
    void attempt(async () => {
      await api.auth.sendCode(address);
      setCode("");
      const resent = stage === "code";
      setStage("code");
      if (resent) {
        setNote("A new code is on its way.");
        codeField.current?.querySelector("input")?.focus();
      }
    });
  };

  // Once the code is asked for, its field is what they need next.
  useEffect(() => {
    if (stage === "code") codeField.current?.querySelector("input")?.focus();
  }, [stage]);

  const signIn = (event: FormEvent) => {
    event.preventDefault();
    if (code.length !== 6) {
      setError("The code is 6 digits. Check your email and type all six.");
      return;
    }
    void attempt(async () => {
      await api.auth.signIn(email.trim(), code);
      await onSignedIn();
    });
  };

  if (stage === "code") {
    return (
      <form onSubmit={signIn} noValidate className="flex flex-1 flex-col">
        <div ref={codeField}>
          <TextField
            label="Your 6-digit code"
            hint={`Sent to ${email.trim()}. It lasts 5 minutes.`}
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={6}
            error={error}
            className="tracking-[0.3em] tabular-nums"
          />
        </div>
        <div className="mt-1 flex flex-wrap gap-x-6">
          <LinkButton icon={<AgainIcon />} onClick={() => sendCode()} disabled={busy}>
            Send a new code
          </LinkButton>
          <LinkButton
            icon={<PencilIcon />}
            onClick={() => {
              setStage("email");
              setError(null);
              setNote(null);
            }}
            disabled={busy}
          >
            Change email
          </LinkButton>
        </div>
        <Notice tone="calm">{note}</Notice>
        <Actions>
          <Button type="submit" full busy={busy}>
            {finishLabel}
          </Button>
        </Actions>
      </form>
    );
  }

  return (
    <form onSubmit={sendCode} noValidate className="flex flex-1 flex-col">
      <TextField
        label="Your email"
        hint="No password. We'll email you a code."
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        autoComplete="email"
        inputMode="email"
        autoCapitalize="none"
        spellCheck={false}
        error={error}
      />
      {googleEnabled && (
        <div className="mt-4">
          <Button
            variant="outline"
            full
            disabled={busy}
            onClick={() => void attempt(() => api.auth.google(returnTo))}
          >
            Continue with Google
          </Button>
        </div>
      )}
      {children}
      <Actions>
        <Button type="submit" full busy={busy}>
          Send my code
        </Button>
      </Actions>
    </form>
  );
}
