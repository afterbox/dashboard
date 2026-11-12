import type { ReactNode } from "react";
import { BackLink } from "@/components/ui/BackLink";
import { Wordmark } from "@/components/ui/Wordmark";

type Props = {
  title: string;
  /** The page's few words, under the title. */
  children: ReactNode;
  /** Still mode (a family in loss): a smaller, quieter headline. */
  still?: boolean;
};

/**
 * A page that stands in for one that isn't built yet: the wordmark, a line,
 * a few words, and the way back. Plain on purpose.
 */
export function PlainPage({ title, children, still = false }: Props) {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-300 flex-col px-5 md:px-6">
      <div className="flex h-16 items-center md:h-18">
        <Wordmark />
      </div>
      <BackLink className="mt-2" />
      <div className="flex flex-1 flex-col justify-center pb-16 md:pb-24">
        <h1
          className={`font-display max-w-3xl text-display-l-mobile text-balance text-ink ${
            still ? "md:text-display-l" : "md:text-display-xl"
          }`}
        >
          {title}
        </h1>
        <div className="mt-4 max-w-md space-y-4 text-body-l-mobile text-pretty text-ink-muted md:mt-6 md:text-body-l">
          {children}
        </div>
      </div>
    </main>
  );
}
