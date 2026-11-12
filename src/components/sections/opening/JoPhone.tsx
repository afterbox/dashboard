import { Tick } from "../fill-it/cards";

/**
 * Jo's guide on a phone: the executor's dashboard as afterbox will show it,
 * built from the tokens. Not a screenshot, and nothing here can be pressed.
 *
 * Still mode, as the design system sets it out: care before tasks, what's
 * done named, one next step, one heartwood action, and a way to stop for today.
 */
const letters = [
  { to: "To the bank", sent: true },
  { to: "To the pension provider", sent: false },
  { to: "To the home insurer", sent: false },
] as const;

export function JoPhone() {
  return (
    <figure
      aria-label="Jo's guide, on a phone"
      className="w-full max-w-76 rounded-xl bg-keepsake p-2"
    >
      <div className="rounded-[calc(var(--radius-xl)-var(--spacing)*2)] bg-linen px-4 pt-5 pb-4">
        <p className="flex items-baseline justify-between text-small text-ink-muted">
          <span className="font-display text-body text-ink">afterbox</span>
          For Jo
        </p>

        <p className="font-display mt-5 text-display-s-mobile text-pretty text-ink">
          We&apos;re so sorry. We&apos;ll take this one step at a time.
        </p>

        <div className="mt-5 rounded-md border border-line bg-paper p-3">
          <p className="text-label text-pretty text-ink">3 of 12 done. Nothing else is urgent today.</p>
          <div aria-hidden className="mt-3 h-1.5 overflow-hidden rounded-pill bg-line">
            <div className="h-full w-1/4 rounded-pill bg-sage" />
          </div>
        </div>

        <p className="mt-5 text-small text-ink-muted">Letters, already written</p>
        <ul className="mt-2 divide-y divide-line rounded-md border border-line bg-paper">
          {letters.map(({ to, sent }) => (
            <li key={to} className="flex min-h-11 items-center justify-between gap-3 px-3 text-body text-ink">
              {to}
              {sent ? (
                <span className="inline-flex items-center gap-1 text-small text-sage">
                  <Tick />
                  Sent
                </span>
              ) : (
                <span className="text-small text-ink-muted">Ready</span>
              )}
            </li>
          ))}
        </ul>

        <span className="mt-4 flex h-12 items-center justify-center rounded-pill bg-heartwood text-label text-on-heartwood">
          Read the next letter
        </span>
        <p className="mt-3 text-center text-label text-ink-muted">That&apos;s enough for today</p>
      </div>
    </figure>
  );
}
