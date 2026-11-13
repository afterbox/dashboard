import type { CSSProperties } from "react";
import { Link } from "@/components/ui/Link";
import { Wordmark } from "@/components/ui/Wordmark";
import { promises, trustLines } from "@/lib/trust-lines";

/** Places on this page. They are the nav's links, in the nav's order. */
const onThisPage = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#families", label: "For families" },
  { href: "/#organisations", label: "For organisations" },
];

/** Pages of their own. */
const pages = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

const link =
  "inline-flex min-h-11 items-center text-body text-linen underline decoration-transparent underline-offset-4 transition-colors duration-200 ease-state hover:decoration-linen";

/** On the band, the focus ring is linen: heartwood would be lost on keepsake. */
const onBand = { "--ab-focus": "var(--ab-linen)" } as CSSProperties;

/**
 * 11. Footer.
 *
 * A keepsake band, the same one as section 5, with the wordmark in linen. It
 * says the three promises once more, in their exact words, then the links and
 * the small print. Nothing moves here: the story has ended at the house, and
 * this is the ground under it.
 *
 * As in section 5, the band holds in Candlelight, where keepsake is a light
 * block and linen is dark.
 */
export function Footer() {
  return (
    <footer data-section="footer" style={onBand} className="bg-keepsake text-linen">
      <div className="mx-auto w-full max-w-300 px-5 pt-14 pb-[max(--spacing(8),env(safe-area-inset-bottom))] md:px-6 md:pt-20">
        <div className="grid gap-x-16 gap-y-12 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <Wordmark tone="text-linen" size="text-display-l-mobile md:text-display-l" />
            <h2 className="eyebrow mt-8 text-linen/80 md:mt-10">Our promises</h2>
            <ul className="mt-4 max-w-140 border-b border-linen/25">
              {promises.map((line) => (
                <li key={line} className="border-t border-linen/25 py-4 text-body-l-mobile text-pretty md:text-body-l">
                  {line}
                </li>
              ))}
            </ul>
          </div>

          <nav aria-label="Footer" className="grid grid-cols-2 content-start gap-x-12 lg:pt-3">
            <ul>
              {onThisPage.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={link}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <ul>
              {pages.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={link}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-linen/25 pt-6 md:mt-16 md:flex-row md:items-baseline md:justify-between md:gap-8">
          <p className="text-body text-linen">{trustLines.advice}</p>
          <p className="text-small text-linen/80">© 2026 afterbox</p>
        </div>
      </div>
    </footer>
  );
}
