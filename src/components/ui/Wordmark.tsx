import Link from "next/link";

type Props = {
  /** The colour it is set in. Ink in the nav; linen on the footer's keepsake band. */
  tone?: string;
  /** The display size it is set at. */
  size?: string;
  /**
   * The one in the top bar. It keeps its place while pages change around it
   * (globals.css, "View transitions"). At most one per page.
   */
  anchored?: boolean;
};

// Until a mark exists, the logo is the name set in Fraunces. Always lowercase.
export function Wordmark({ tone = "text-ink", size = "text-display-s-mobile", anchored = false }: Props) {
  return (
    <Link
      href="/"
      aria-label="afterbox, home"
      style={anchored ? { viewTransitionName: "site-wordmark" } : undefined}
      className={`font-display inline-flex min-h-11 items-center ${size} ${tone}`}
    >
      afterbox
    </Link>
  );
}
