"use client";

import type { PlanChoice, Relationship } from "@/lib/schemas";
import { pronounsFor } from "@/lib/words";

/**
 * PLACEHOLDER prices. Payments aren't built: choosing the paid plan records
 * interest only. Replace these when pricing is decided.
 */
export const prices = { monthly: "£[price]", yearly: "£[price]" } as const;

export const paidSoon = "Paid plans open soon. We'll save your place and let you know.";

/** "Whatever you choose, Mary's message will always reach her." */
export const offerPromise = (name: string, relationship: Relationship | null | undefined) =>
  `Whatever you choose, ${name}'s message will always reach ${pronounsFor(relationship).them}.`;

type Props = {
  /** The choice made so far, if any. */
  chosen: PlanChoice | null;
  onChoose: (choice: PlanChoice) => void;
  disabled?: boolean;
  /** The words on the free choice: "Keep going free" in onboarding; "Stay with one for now" once they're in. */
  freeLabel?: string;
};

const includes = [
  "Everyone you love",
  "Unlimited voice notes and letters",
  "afterbox spotting what you'd forget",
  "A step-by-step guide for your executor",
];

const choiceBox =
  "flex w-full flex-col rounded-lg border bg-paper p-5 text-left transition-colors duration-200 ease-state disabled:opacity-60 aria-pressed:border-keepsake aria-pressed:bg-blush";

/**
 * The offer: two equal choices, the same size and weight, one above the
 * other. Neither is the "right" one, so neither is the heartwood button.
 * Never an error, never a wall.
 */
export function Offer({ chosen, onChoose, disabled, freeLabel = "Keep going free" }: Props) {
  return (
    <div className="grid auto-rows-fr gap-3">
      <button
        type="button"
        aria-pressed={chosen === "paid_interest"}
        disabled={disabled}
        onClick={() => onChoose("paid_interest")}
        className={`${choiceBox} ${chosen === "paid_interest" ? "border-keepsake" : "border-ink-muted hover:border-ink"}`}
      >
        <span className="font-display text-display-s-mobile text-ink">Build gifts for everyone</span>
        <ul className="mt-3 space-y-1.5 text-small text-ink-muted">
          {includes.map((line) => (
            <li key={line} className="flex gap-2">
              <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-pill bg-lantern" />
              {line}
            </li>
          ))}
        </ul>
        <span className="mt-4 text-label text-ink">
          {prices.monthly} a month or {prices.yearly} a year
        </span>
      </button>

      <button
        type="button"
        aria-pressed={chosen === "free"}
        disabled={disabled}
        onClick={() => onChoose("free")}
        className={`${choiceBox} ${chosen === "free" ? "border-keepsake" : "border-ink-muted hover:border-ink"}`}
      >
        <span className="font-display text-display-s-mobile text-ink">{freeLabel}</span>
        <ul className="mt-3 space-y-1.5 text-small text-ink-muted">
          <li className="flex gap-2">
            <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-pill bg-lantern" />
            One person you love
          </li>
        </ul>
        <span className="mt-auto pt-4 text-label text-ink">Free</span>
      </button>
    </div>
  );
}
