"use client";

import { Link } from "@/components/ui/Link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { stepPath } from "@/lib/onboarding";
import { Wordmark } from "@/components/ui/Wordmark";
import { useSession, useSignedIn } from "@/store/session";
import { CodeSignIn } from "./CodeSignIn";

/**
 * /signin: for someone coming back. Email, then the 6-digit code; Google only
 * once it has been set up. Whoever signs in goes to their gifts, or carries on
 * with onboarding exactly where they left it.
 */
export function SignIn() {
  const router = useRouter();
  const heading = useRef<HTMLHeadingElement>(null);
  // Whether to offer Google is the server's to say.
  const googleEnabled = useSession().data?.googleEnabled ?? false;
  const askWhoIsHere = useSignedIn();

  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, []);

  const signedIn = async () => {
    const state = await askWhoIsHere();
    if (state.completed) {
      // The landing page's buttons now read "Go to your gifts".
      document.documentElement.setAttribute("data-member", "");
      router.push("/home");
    } else {
      router.push(stepPath(state.currentStep));
    }
  };

  return (
    <div className="flex min-h-dvh flex-1 flex-col">
      <header className="pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex h-16 w-full max-w-300 items-center px-5 md:h-18 md:px-6">
          <Wordmark anchored />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-120 flex-1 flex-col px-5 pt-8 pb-10 md:pt-16">
        <h1
          ref={heading}
          tabIndex={-1}
          className="font-display text-display-m-mobile text-balance text-ink outline-none md:text-display-m"
        >
          Welcome back.
        </h1>
        <p className="mt-3 mb-6 text-body-l-mobile text-pretty text-ink-muted md:text-body-l">
          Sign in to carry on with the gifts you&apos;ve started.
        </p>

        <CodeSignIn googleEnabled={googleEnabled} returnTo="/home" onSignedIn={signedIn} finishLabel="Sign in" />

        <p className="mt-6 text-small text-ink-muted">
          New here?{" "}
          <Link
            href="/start"
            className="inline-flex min-h-11 items-center font-semibold text-ink underline decoration-line decoration-2 underline-offset-4"
          >
            Build their gift
          </Link>
        </p>
      </main>
    </div>
  );
}
