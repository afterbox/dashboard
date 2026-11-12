import Link from "next/link";

type Props = {
  /** `solid` is the one heartwood action on a screen. `quiet` steps back when another one is showing. */
  variant?: "solid" | "quiet";
  /** `nav` is compact on phones (40px). `hero` is 48px on phones and 52px from tablets up. */
  size?: "nav" | "hero";
  /** `closing` is the last call to action on the page, in the final scene. */
  label?: "primary" | "closing";
  className?: string;
};

const variants = {
  solid: "border-transparent bg-heartwood text-on-heartwood hover:bg-heartwood-deep",
  quiet: "border-ink-muted bg-transparent text-ink hover:border-ink",
};

const sizes = {
  // Phones: a small pill, 40px tall, so it doesn't crowd the wordmark. The
  // unseen `before` layer stretches what can be tapped to 44px.
  nav: "relative h-10 px-4 text-small font-semibold before:absolute before:inset-x-0 before:-inset-y-0.75 md:h-12 md:px-6 md:text-label md:before:hidden",
  hero: "h-12 px-6 text-label md:h-13 md:px-8",
};

const labels = {
  primary: "Build their gift",
  closing: "Begin with someone you love",
};

// The way in: onboarding, then sign-up, then the dashboard. /start stands in until those exist.
export function GiftButton({
  variant = "solid",
  size = "nav",
  label = "primary",
  className = "",
}: Props) {
  return (
    <Link
      href="/start"
      className={`inline-flex items-center justify-center rounded-pill border whitespace-nowrap transition-colors duration-200 ease-state ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {labels[label]}
    </Link>
  );
}
