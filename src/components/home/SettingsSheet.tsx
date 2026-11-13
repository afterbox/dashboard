"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ThemeToggle } from "@/components/app/ThemeToggle";
import { Button, Notice, Sheet, Switch, TextField } from "@/components/app/ui";
import { errorMessage } from "@/lib/api-client";
import type { OnboardingState } from "@/lib/schemas";
import { useSavePreferences, useSaveSignOff, useSignOut } from "@/store/session";

type Props = {
  open: boolean;
  account: OnboardingState | null;
  onClose: () => void;
};

/**
 * The account sheet: who is signed in, how they sign their gifts, the theme,
 * reminder emails, and the way out (here, or on every device).
 */
export function SettingsSheet({ open, account, onClose }: Props) {
  return (
    <Sheet open={open} onClose={onClose} title="Your account">
      {account?.user ? (
        <Settings account={account} />
      ) : (
        <div aria-busy="true" className="min-h-40" />
      )}
    </Sheet>
  );
}

function Settings({ account }: { account: OnboardingState }) {
  const router = useRouter();
  const { mutateAsync: saveSignOff } = useSaveSignOff();
  const { mutate: savePreference } = useSavePreferences();
  const { mutateAsync: signOut } = useSignOut();
  const [name, setName] = useState(account.user?.name ?? "");
  const [busy, setBusy] = useState<"name" | "out" | "everywhere" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const attempt = async (what: NonNullable<typeof busy>, work: () => Promise<void>) => {
    setBusy(what);
    setError(null);
    setSaved(null);
    try {
      await work();
    } catch (problem) {
      setError(errorMessage(problem));
    } finally {
      setBusy(null);
    }
  };

  const saveName = (event: FormEvent) => {
    event.preventDefault();
    void attempt("name", async () => {
      await saveSignOff(name.trim());
      setSaved(name.trim() ? `Your gifts are now signed "from ${name.trim()}".` : "Saved.");
    });
  };

  // The switch shows the choice at once (the store holds it); if saving fails it goes back, and this says why.
  const toggleReminders = (on: boolean) => {
    setError(null);
    savePreference({ reminderEmails: on }, { onError: (problem) => setError(errorMessage(problem)) });
  };

  // Back to the landing page. The store forgets what it loaded as /home leaves the screen, so nothing of theirs stays behind.
  const leave = (everywhere: boolean) =>
    attempt(everywhere ? "everywhere" : "out", async () => {
      await signOut({ everywhere });
      router.replace("/");
    });

  return (
    <div className="space-y-6">
      <p className="text-body text-ink-muted">
        Signed in as <span className="break-all text-ink">{account.user?.email}</span>
      </p>

      <form onSubmit={saveName} noValidate className="flex items-end gap-3">
        <div className="min-w-0 flex-1">
          <TextField
            label="How you sign your gifts"
            hint="What they call you: Dad, Mum, Grandpa Joe."
            handwritten
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={40}
            autoComplete="off"
          />
        </div>
        <Button type="submit" variant="outline" busy={busy === "name"}>
          Save
        </Button>
      </form>
      <Notice tone="calm">{saved}</Notice>

      <div>
        <p className="mb-2 text-label text-ink">Theme</p>
        <ThemeToggle />
      </div>

      <Switch
        label="Reminder emails"
        hint="A gentle nudge when life changes. Easy to turn off."
        checked={account.preference.reminderEmails}
        onChange={toggleReminders}
      />

      <div className="border-t border-line pt-5">
        <Notice>{error}</Notice>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Button variant="outline" busy={busy === "out"} disabled={busy !== null} onClick={() => leave(false)}>
            Sign out
          </Button>
          <Button variant="quiet" busy={busy === "everywhere"} disabled={busy !== null} onClick={() => leave(true)}>
            Sign out everywhere
          </Button>
        </div>
      </div>
    </div>
  );
}
