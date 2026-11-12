import type { ReactNode } from "react";

/**
 * The product cards in section 3: afterbox as it will look, built from the
 * tokens. Not screenshots. Each is the inside of a card; ./beats.tsx puts the
 * paper round it.
 *
 * They are a demo that plays as the page scrolls, so nothing here can be
 * pressed: the buttons are drawn, not real.
 */

/** A card: paper, resting. The border keeps its edge in Candlelight. */
export const paper = "rounded-lg border border-line bg-paper p-5 shadow-rest";

export function Tick({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={`size-5 shrink-0 fill-none stroke-current ${className}`}>
      <path d="M5.5 12.5l4.25 4.25L18.5 8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Who a thing is for. The dot is that person's colour in the cast. */
const people = {
  Jo: "bg-keepsake",
  Mary: "bg-lantern",
} as const;

type Who = keyof typeof people;

/** The top line of a card: what kind of thing it is, and who it is for. */
export function Kind({ children, who }: { children: ReactNode; who?: Who }) {
  return (
    <p className="flex items-center justify-between gap-3 text-small text-ink-muted">
      <span>{children}</span>
      {who && (
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className={`size-2 rounded-pill ${people[who]}`} />
          For {who}
        </span>
      )}
    </p>
  );
}

/** Beat 1, before it turns over: the bank, connected. The block stands in for the bank's logo. */
export function BankConnected() {
  return (
    <>
      <Kind>Your accounts</Kind>
      <div className="mt-3 flex items-center gap-3">
        <span aria-hidden className="size-11 shrink-0 rounded-md bg-keepsake" />
        <div className="min-w-0 flex-1">
          <p className="text-label text-ink">Your bank</p>
          <p className="text-small text-ink-muted">Current account</p>
        </div>
        <p className="inline-flex items-center gap-1 text-small text-sage">
          <Tick />
          Connected
        </p>
      </div>
      <p className="mt-4 border-t border-line pt-3 text-small text-ink-muted">
        Read-only. We never ask for passwords, PINs or card numbers.
      </p>
    </>
  );
}

/** Beat 1, turned over: what afterbox noticed. `pressed` is the moment "Add it" goes down. */
export function Noticed({ pressed = false }: { pressed?: boolean }) {
  return (
    <>
      <p className="text-body-l-mobile text-pretty text-ink md:text-body-l">
        We noticed a monthly payment to an insurer. Is that a life policy?
      </p>
      <p className="mt-2 text-small text-ink-muted">£38.50, on the 1st of each month</p>
      <div className="mt-4 flex items-center gap-5">
        <span
          className={`inline-flex h-11 items-center rounded-pill px-6 text-label text-on-heartwood transition-[scale,background-color] duration-200 ease-state ${
            pressed ? "scale-94 bg-heartwood-deep" : "bg-heartwood"
          }`}
        >
          Add it
        </span>
        <span className="text-label text-ink-muted">Not mine</span>
      </div>
    </>
  );
}

type RecordProps = { kind: string; who: Who; title: string; note: string };

/** Beat 2: one pension or policy, as a short record. */
export function Record({ kind, who, title, note }: RecordProps) {
  return (
    <>
      <Kind who={who}>{kind}</Kind>
      <p className="mt-2 text-title text-ink">{title}</p>
      <p className="mt-1 text-small text-ink-muted">{note}</p>
    </>
  );
}

type KeptProps = { kind: string; who?: Who; title: string; label: string; value: string };

/** Beats 3 and 4: a question, and what you wrote in answer to it. */
export function Kept({ kind, who, title, label, value }: KeptProps) {
  return (
    <>
      <Kind who={who}>{kind}</Kind>
      <p className="mt-2 text-title text-pretty text-ink">{title}</p>
      <p className="mt-4 text-small text-ink-muted">{label}</p>
      <p className="mt-1 rounded-md bg-linen px-3 py-2.5 text-body text-ink">{value}</p>
    </>
  );
}
