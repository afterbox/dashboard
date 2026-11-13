"use client";

import { useEffect, useState } from "react";
import { applyTheme, ThemeToggle } from "@/components/app/ThemeToggle";
import { Wordmark } from "@/components/ui/Wordmark";
import { ApiError } from "@/lib/api-client";
import { useGifts } from "@/store/gifts";
import { usePeople } from "@/store/people";
import { useSession } from "@/store/session";
import { useShelf } from "@/store/shelf";
import { AddSomeone } from "./AddSomeone";
import { PersonGifts } from "./PersonGifts";
import { PersonSheet, type Opening } from "./PersonSheet";
import { SettingsSheet } from "./SettingsSheet";
import { Shelf } from "./Shelf";

/**
 * /home, first version: their people as gift boxes, each person's gifts, the
 * shelf of what they'll need to find, and a way to add someone else.
 *
 * Gift mode. The page itself is the same for everyone and holds nothing
 * personal; everything here is read from the store (src/store), which loads
 * it in the browser from /api, where every query is checked against the
 * signed-in owner. Each list refreshes by itself when it changes, and someone
 * who turns out to be signed out is sent to sign in (src/store/client.ts).
 */
export function Home() {
  const session = useSession();
  const people = usePeople();
  const gifts = useGifts();
  const shelf = useShelf();
  const [opening, setOpening] = useState<Opening | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Straight from onboarding these are in the store already, so their first box is drawn at once and travels in.
  const data =
    people.data && gifts.data && shelf.data ? { people: people.data, gifts: gifts.data, items: shelf.data } : null;
  // Not being signed in any more is not a failure to show: the store is already sending them to sign in.
  const failed =
    !data && [people, gifts, shelf].some((each) => each.isError && !(each.error instanceof ApiError && each.error.status === 401));
  const account = session.data ?? null;

  const tryAgain = () => {
    for (const each of [session, people, gifts, shelf]) if (!each.data) void each.refetch();
  };

  // The theme they chose follows them to this device.
  const theme = account?.user ? account.preference.theme : null;
  useEffect(() => {
    if (theme) applyTheme(theme);
  }, [theme]);

  const signOff = account?.user?.name ?? null;
  const person = opening ? data?.people.find((each) => each.id === opening.personId) : undefined;

  return (
    <div className="flex min-h-dvh flex-1 flex-col">
      <header className="pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex h-16 w-full max-w-300 items-center justify-between gap-2 px-5 md:h-18 md:px-6">
          <Wordmark anchored />
          <div className="flex items-center gap-1 md:gap-3">
            <ThemeToggle compact />
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              aria-haspopup="dialog"
              aria-label="Your account"
              className="-mr-2.5 inline-flex size-11 items-center justify-center rounded-pill text-ink"
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden
                className="size-6 fill-none stroke-current [stroke-linecap:round] [stroke-width:1.5]"
              >
                <circle cx="12" cy="8.5" r="3.5" />
                <path d="M5 19.5c1-3.3 3.7-5 7-5s6 1.7 7 5" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-300 flex-1 px-5 pt-4 pb-16 md:px-6 md:pt-10 md:pb-24">
        <h1 className="font-display max-w-2xl text-display-l-mobile text-balance text-ink md:text-display-l">
          For the people you love most
        </h1>
        <p className="mt-3 max-w-md text-body-l-mobile text-pretty text-ink-muted md:text-body-l">
          Each box is someone&apos;s gift. It stays sealed until the time comes, and grows whenever you add to it.
        </p>

        {failed && (
          <div className="mt-8">
            <p role="alert" className="text-body text-ink">
              We couldn&apos;t reach afterbox. Nothing you made is lost. Check your connection and try again.
            </p>
            <button
              type="button"
              onClick={tryAgain}
              className="mt-4 inline-flex min-h-12 items-center rounded-pill border border-ink-muted px-6 text-label text-ink"
            >
              Try again
            </button>
          </div>
        )}

        {data ? (
          <>
            <section aria-label="Your people" className="mt-8 space-y-10 md:mt-12 md:space-y-14">
              {data.people.map((each, i) => (
                <PersonGifts
                  key={each.id}
                  person={each}
                  gifts={data.gifts.filter((gift) => gift.personId === each.id)}
                  signOff={signOff}
                  // Only one box on the page may travel: the one onboarding carries in.
                  travels={i === 0}
                  onOpen={(start) => setOpening({ personId: each.id, ...start })}
                />
              ))}
              <AddSomeone people={data.people} />
            </section>

            <Shelf items={data.items} />
          </>
        ) : (
          !failed && <div aria-busy="true" className="min-h-80" />
        )}
      </main>

      <PersonSheet
        opening={person ? opening : null}
        person={person ?? null}
        gifts={person ? (data?.gifts.filter((gift) => gift.personId === person.id) ?? []) : []}
        signOff={signOff}
        onClose={() => setOpening(null)}
        onSignOff={() => {
          setOpening(null);
          setSettingsOpen(true);
        }}
      />
      <SettingsSheet
        open={settingsOpen}
        account={account}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}
