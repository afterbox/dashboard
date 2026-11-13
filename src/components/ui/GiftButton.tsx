"use client";

import { Link } from "@/components/ui/Link";
import { useSyncExternalStore } from "react";

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

const never = () => () => { };

/**
 * True for someone who has finished onboarding on this device. The page is
 * static, so this is read from <html data-member>, which a script sets before
 * the first paint (src/lib/hints.ts).
 */
function useIsMember() {
  return useSyncExternalStore(
    never,
    () => document.documentElement.hasAttribute("data-member"),
    () => false,
  );
}

/**
 * The way in. For someone new: onboarding (/start), where the gift box travels
 * with them (the `to-gift` transition; globals.css). For someone who already
 * has gifts it reads "Go to your gifts" and leads to /home.
 *
 * Both sets of words are in the page and CSS shows one (`member:`), so the
 * right one is there from the first paint. Should the address ever be the
 * stale one, the routing guard sends them on to the right place.
 */
export function GiftButton({
  variant = "solid",
  size = "nav",
  label = "primary",
  className = "",
}: Props) {
  const member = useIsMember();

  return (
    <Link
      href={member ? "/home" : "/start"}
      transitionTypes={["to-gift"]}
      className={`inline-flex items-center justify-center rounded-pill border whitespace-nowrap transition-colors duration-200 ease-state ${variants[variant]} ${sizes[size]} ${className}`}
    >
      <span className="member:hidden">{labels[label]}</span>
      <span className="hidden member:inline">Go to your gifts</span>
    </Link>
  );
}
