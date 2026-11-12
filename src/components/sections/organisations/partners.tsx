import type { CSSProperties, ReactNode } from "react";
import { Tick } from "../fill-it/cards";

/**
 * Section 9: what each kind of partner is told, and the example of where
 * "[Partner logo] · powered by afterbox" would really sit for them.
 *
 * Partner mode (docs/design-system.md): afterbox's tokens stay in charge. The
 * partner's logo appears in the header lockup only, and their colour only
 * through `partner-accent`, on the example's button. No real or invented
 * companies: the logo is a plain rounded block, and each example's accent is
 * one of our own colours standing in for theirs.
 *
 * The examples are drawn, not real: nothing in them can be pressed.
 */
export type Partner = {
  id: string;
  tab: string;
  headline: string;
  lines: readonly [string, string];
  /** What the example is, in a few words, set under it. */
  caption: string;
  example: ReactNode;
  /** The example runs on past the bottom of its stage (a phone's screen), rather than sitting on it. */
  runsOn?: boolean;
};

/** Stands in for the partner's own colour. Both pass the contrast checks under `on-heartwood`, light and dark. */
const accent = (token: string) => ({ "--ab-partner-accent": `var(--ab-${token})` }) as CSSProperties;

/** The header lockup: the partner's logo (a plain block), then "powered by afterbox". */
function Lockup() {
  return (
    <p className="flex h-12 items-center gap-2 border-b border-line px-4 text-small text-ink-muted">
      <span className="h-5 w-16 rounded-sm bg-ink-muted/35">
        <span className="sr-only">Partner logo</span>
      </span>
      <span aria-hidden>·</span>
      <span>
        powered by <span className="font-display text-ink">afterbox</span>
      </span>
    </p>
  );
}

/** The example's one button, in the partner's colour. Drawn, not real. */
function AccentButton({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-11 items-center rounded-pill bg-partner-accent px-5 text-label text-on-heartwood">
      {children}
    </span>
  );
}

const frame = "w-full overflow-hidden border border-line bg-linen";

export const partners: readonly Partner[] = [
  {
    id: "employers",
    tab: "Employers",
    headline: "A gift to your team, and the people they love.",
    lines: [
      "Give everyone who works for you a place to gather what their family would need to find.",
      "It's theirs to keep building, whatever happens next.",
    ],
    caption: "The welcome someone on your team sees.",
    example: (
      <div style={accent("keepsake")} className={`${frame} max-w-88 rounded-lg`}>
        <Lockup />
        <div className="px-4 pt-5 pb-5">
          <p className="font-display text-display-s-mobile text-pretty text-ink">
            A gift from{" "}
            <span className="inline-block h-[0.62em] w-20 rounded-sm bg-ink-muted/35 align-baseline">
              <span className="sr-only">your company</span>
            </span>{" "}
            to you and the people you love.
          </p>
          <p className="mt-5">
            <AccentButton>Open your gift</AccentButton>
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "insurers",
    tab: "Insurers",
    headline: "Fewer unclaimed policies. Families who know what they have.",
    lines: [
      "Your policyholders note where their policy lives, so the people they love can find it.",
      "When the time comes, the family knows to come to you.",
    ],
    caption: "The top of a policyholder's page.",
    example: (
      <div style={accent("sage")} className={`${frame} max-w-104 rounded-lg`}>
        <Lockup />
        <div className="px-4 pt-4 pb-5">
          <p className="text-small text-ink-muted">Your life policy</p>
          <p className="mt-2 flex items-center gap-2 rounded-md border border-line bg-paper px-3 py-2.5 text-body text-ink">
            <Tick className="text-sage" />
            Jo will know where to find it.
          </p>
          <p className="mt-4">
            <AccentButton>Keep it for Jo</AccentButton>
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "banks",
    tab: "Banks",
    headline: "A caring feature for your customers and their families.",
    lines: [
      "Offer it inside your own app, under your own name.",
      "Your customers build it over the years. Their families are looked after when it matters.",
    ],
    caption: "A screen in your own app.",
    runsOn: true,
    example: (
      // The top of a phone: the screen runs on below the edge of its stage.
      <div style={accent("ink")} className={`${frame} max-w-68 rounded-t-xl border-b-0`}>
        <div aria-hidden className="mx-auto mt-2.5 h-1 w-10 rounded-pill bg-line" />
        <Lockup />
        <div className="px-4 pt-5 pb-7">
          <p className="font-display text-display-s-mobile text-pretty text-ink">For the people you love most.</p>
          <p className="mt-2 text-small text-ink-muted">What they&apos;d need, kept together.</p>
          <p className="mt-5">
            <AccentButton>Start with one thing</AccentButton>
          </p>
        </div>
      </div>
    ),
  },
];
