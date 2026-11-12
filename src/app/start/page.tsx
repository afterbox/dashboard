import type { Metadata } from "next";
import { BackLink } from "@/components/ui/BackLink";
import { Wordmark } from "@/components/ui/Wordmark";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Who will you build it for?",
  description:
    "Start building afterbox for someone you love: what they'll need to find, and what you want them to hear, one small piece at a time.",
  path: "/start",
});

// PLACEHOLDER until onboarding exists. Its first question is the one onboarding will open with.
export default function Start() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-300 flex-col px-5 md:px-6">
      <div className="flex h-16 items-center md:h-18">
        <Wordmark />
      </div>
      <BackLink className="mt-2" />
      <div className="flex flex-1 flex-col justify-center pb-16 md:pb-24">
        <h1 className="font-display max-w-3xl text-display-l-mobile text-balance text-ink md:text-display-xl">
          Who will you build it for?
        </h1>
        <p className="mt-4 max-w-md text-body-l-mobile text-pretty text-ink-muted md:mt-6 md:text-body-l">
          Think of someone you love. Soon you&apos;ll be able to start gathering what they&apos;ll
          need, and what you want them to hear, one small piece at a time.
        </p>
      </div>
    </main>
  );
}
