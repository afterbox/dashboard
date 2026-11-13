import { Link } from "@/components/ui/Link";
import { trustLines } from "@/lib/trust-lines";
import { SlowFade } from "./kitchen-table/SlowFade";
import { Asked } from "./lazy";
// The section's styles load with the page; its script comes later (./lazy.tsx).
import "./families/families.css";

/**
 * What a family asks in the first weeks, and the first step afterbox gives.
 * Steps, never advice: where to start, who to tell, where to look.
 * The structured data repeats them, word for word (src/lib/structured-data.ts).
 */
export const asked = [
  {
    question: "Where do I find Dad's pension?",
    answer: "Start here. We'll help you trace it in three steps.",
  },
  {
    question: "Who do I need to tell first?",
    answer: "Only a few people this week. We'll show you who, and write the letters with you.",
  },
  {
    question: "What if we can't find a will?",
    answer: "That happens more often than you'd think. We'll show you where to look, one place at a time.",
  },
] as const;

/**
 * 8. "For families, right now": family support. Still mode.
 * Carries the "For families" anchor from the navigation and the footer.
 *
 * For anyone who has just lost someone, whether or not that person used
 * afterbox. No illustrated cast at all: only words. Each question types
 * itself, once, with the timing of section 2's search bar, and its answer
 * fades in beneath it (./families/Asked.tsx).
 *
 * Paper, between two linen sections, with a hairline above and below. One
 * action, and it is a quiet one: "Get help now". On a phone it stays at the
 * bottom of the screen for as long as the section is there, so it is always
 * within reach; on a wide screen it stays beside the questions with the words.
 */
export function FamilySupport() {
  return (
    <section
      id="families"
      data-section="family-support"
      aria-labelledby="families-line"
      className="scroll-mt-16 border-y border-line bg-paper md:scroll-mt-18"
    >
      <div className="mx-auto w-full max-w-300 px-5 pt-20 pb-6 md:px-6 lg:grid lg:grid-cols-12 lg:gap-x-6 lg:pt-28 lg:pb-28">
        <SlowFade className="lg:sticky lg:top-32 lg:col-span-5 lg:self-start">
          <h2
            id="families-line"
            className="font-display text-display-l-mobile text-balance text-ink md:text-display-l"
          >
            For families, right now.
          </h2>
          <p className="mt-5 max-w-md text-body-l-mobile text-pretty text-ink-muted md:text-body-l">
            Even if the person you lost never used afterbox, we&apos;ll help you find what they had and settle
            it, one step at a time.
          </p>
          <div className="hidden lg:block">
            <GetHelp />
          </div>
        </SlowFade>

        <ul className="mt-6 lg:col-span-6 lg:col-start-7 lg:mt-0">
          {asked.map((pair) => (
            // A phone: one question and its answer to a screen.
            <li key={pair.question} className="flex min-h-[78svh] flex-col justify-center lg:min-h-[52svh]">
              <Asked {...pair} />
            </li>
          ))}
        </ul>

        <div className="sticky bottom-0 -mx-5 bg-paper px-5 pt-3 pb-[max(--spacing(4),env(safe-area-inset-bottom))] md:-mx-6 md:px-6 lg:hidden">
          <GetHelp />
        </div>
      </div>
    </section>
  );
}

/** The one action here, kept quiet. The small print under it is one of the trust lines, word for word. */
function GetHelp() {
  return (
    <>
      <Link
        href="/family-support"
        className="inline-flex h-12 w-full items-center justify-center rounded-pill border border-ink-muted px-6 text-label whitespace-nowrap text-ink transition-colors duration-200 ease-state hover:border-ink md:h-13 md:px-8 lg:mt-8 lg:w-auto"
      >
        Get help now
      </Link>
      <p className="mt-3 text-center text-small text-ink-muted lg:mt-4 lg:text-left">{trustLines.advice}</p>
    </>
  );
}
