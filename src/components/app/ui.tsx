"use client";

import {
  useEffect,
  useId,
  useRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";
import "./app.css";

/**
 * The app's few controls, in the design system's tokens: the button, the chip,
 * the field, the switch and the sheet. Every one is at least 44px to touch and
 * shows the focus ring.
 */

// ── Button ──────────────────────────────────────────────────────────────────

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /**
   * `solid` is the one heartwood action on a screen. `outline` is an equal or
   * second choice. `quiet` is a way out that doesn't ask for attention.
   */
  variant?: "solid" | "outline" | "quiet";
  /** Full width: the primary button on a phone. */
  full?: boolean;
  /** Working on it: can't be pressed again, and says so to a screen reader. */
  busy?: boolean;
};

const buttonVariants = {
  solid: "border-transparent bg-heartwood text-on-heartwood hover:bg-heartwood-deep",
  outline: "border-ink-muted bg-transparent text-ink hover:border-ink",
  quiet: "border-transparent bg-transparent text-ink underline decoration-line decoration-2 underline-offset-4 hover:decoration-ink-muted",
};

export function Button({
  variant = "solid",
  full = false,
  busy = false,
  disabled,
  className = "",
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      className={`relative inline-flex min-h-12 items-center justify-center rounded-pill border px-6 py-2 text-center text-label transition-[color,background-color,border-color,opacity] duration-200 ease-state disabled:not-aria-busy:opacity-50 ${
        buttonVariants[variant]
      } ${full ? "w-full" : ""} ${className}`}
      {...rest}
    >
      {/* The words keep their room while it works, so the button doesn't change size. */}
      <span className={busy ? "opacity-0" : undefined}>{children}</span>
      {busy && (
        <span aria-hidden className="busy-dots absolute inset-0 flex items-center justify-center gap-1.5">
          <span />
          <span />
          <span />
        </span>
      )}
    </button>
  );
}

// ── Chips: one choice from a few ────────────────────────────────────────────

type ChipsProps<T extends string> = {
  /** What is being chosen, for screen readers. */
  legend: string;
  /** Show the legend as a label above the chips. */
  showLegend?: boolean;
  name: string;
  options: readonly { value: T; label: string }[];
  value: T | null;
  onChange: (value: T) => void;
};

export function Chips<T extends string>({ legend, showLegend = false, name, options, value, onChange }: ChipsProps<T>) {
  return (
    <fieldset>
      <legend className={showLegend ? "mb-2 text-label text-ink" : "sr-only"}>{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label
            key={option.value}
            className="inline-flex min-h-11 cursor-pointer items-center rounded-pill border border-ink-muted px-4 text-label text-ink transition-colors duration-200 ease-state hover:border-ink has-checked:border-keepsake has-checked:bg-keepsake has-checked:text-linen has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus"
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** A suggestion to tap: it fills something in, or offers an idea. Not a choice that stays chosen. */
export function Suggestion({ className = "", ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`inline-flex min-h-11 items-center rounded-pill border border-dashed border-ink-muted px-4 py-1.5 text-left text-small text-ink transition-colors duration-200 ease-state hover:border-ink aria-pressed:border-solid aria-pressed:border-keepsake aria-pressed:bg-blush ${className}`}
      {...rest}
    />
  );
}

// ── Fields ──────────────────────────────────────────────────────────────────

type FieldBase = {
  label: string;
  /** A line under the label: what it is for, or what not to put in it. */
  hint?: string;
  /** What is wrong, in a sentence. Read out when it appears. */
  error?: string | null;
  /** The user's own words, in the handwritten face. */
  handwritten?: boolean;
};

const fieldBox =
  "w-full rounded-md border border-ink-muted bg-paper px-4 text-ink placeholder:text-ink-muted/80 aria-invalid:border-alert";

function FieldFrame({
  id,
  label,
  hint,
  error,
  children,
}: FieldBase & { id: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="block text-label text-ink">
        {label}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="mt-1 text-small text-ink-muted">
          {hint}
        </p>
      )}
      <div className="mt-2">{children}</div>
      <p id={`${id}-error`} role="alert" className="mt-1.5 text-small text-alert empty:hidden">
        {error}
      </p>
    </div>
  );
}

const describedBy = (id: string, hint?: string, error?: string | null) =>
  [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;

export function TextField({
  label,
  hint,
  error,
  handwritten = false,
  className = "",
  ...rest
}: FieldBase & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <FieldFrame id={id} label={label} hint={hint} error={error}>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={`${fieldBox} h-12 ${handwritten ? "font-note text-note" : "text-body"} ${className}`}
        {...rest}
      />
    </FieldFrame>
  );
}

export function TextArea({
  label,
  hint,
  error,
  className = "",
  ...rest
}: FieldBase & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  return (
    <FieldFrame id={id} label={label} hint={hint} error={error}>
      <textarea
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={`${fieldBox} min-h-40 resize-y py-3 text-body ${className}`}
        {...rest}
      />
    </FieldFrame>
  );
}

// ── Switch ──────────────────────────────────────────────────────────────────

type SwitchProps = {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
};

export function Switch({ label, hint, checked, onChange, disabled }: SwitchProps) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p id={`${id}-label`} className="text-label text-ink">
          {label}
        </p>
        {hint && (
          <p id={`${id}-hint`} className="mt-0.5 text-small text-ink-muted">
            {hint}
          </p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-label`}
        aria-describedby={hint ? `${id}-hint` : undefined}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className="group relative inline-flex h-11 w-16 shrink-0 items-center disabled:opacity-50"
      >
        <span className="h-8 w-14 rounded-pill border border-ink-muted bg-paper transition-colors duration-200 ease-state group-aria-checked:border-keepsake group-aria-checked:bg-keepsake" />
        <span className="absolute left-1.5 size-6 rounded-pill bg-ink-muted transition-transform duration-200 ease-state group-aria-checked:translate-x-6 group-aria-checked:bg-linen" />
      </button>
    </div>
  );
}

// ── Sheet ───────────────────────────────────────────────────────────────────

type SheetProps = {
  open: boolean;
  onClose: () => void;
  /** Its heading, which also names it for screen readers. */
  title: string;
  children: ReactNode;
};

/**
 * "Sheets, not modals": details and confirmations rise from the bottom edge,
 * on paper. A native <dialog>, so focus is held inside it, Escape closes it,
 * and focus goes back where it was. Tapping outside closes it too.
 */
export function Sheet({ open, onClose, title, children }: SheetProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const id = useId();

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  // Leaving the page with a sheet open: the page is kept, hidden, for coming
  // back to, and a modal left open in it would hold the next page still.
  useEffect(() => {
    const el = dialog.current;
    return () => {
      if (el?.open) el.close();
    };
  }, []);

  return (
    <dialog
      ref={dialog}
      aria-labelledby={id}
      onClose={onClose}
      onClick={(event) => event.target === event.currentTarget && onClose()}
      className="sheet fixed inset-x-0 top-auto bottom-0 m-0 mx-auto max-h-[92dvh] w-full max-w-140 overflow-y-auto overscroll-contain rounded-t-xl border border-b-0 border-line bg-paper text-ink shadow-lift backdrop:bg-linen/80"
    >
      <div className="px-5 pt-3 pb-[max(--spacing(6),env(safe-area-inset-bottom))] md:px-8">
        <div aria-hidden className="mx-auto h-1 w-10 rounded-pill bg-line" />
        <div className="mt-3 flex items-start justify-between gap-4">
          <h2 id={id} className="font-display text-display-s-mobile text-balance text-ink md:text-display-s">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2.5 inline-flex size-11 shrink-0 items-center justify-center rounded-pill text-ink"
          >
            <svg viewBox="0 0 24 24" aria-hidden className="size-6 fill-none stroke-current">
              <path d="M6 6l12 12M18 6 6 18" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        {/* Only while open, so a recorder or a half-typed letter never lingers behind a closed sheet. */}
        <div className="mt-4">{open && children}</div>
      </div>
    </dialog>
  );
}

/** Something to tell them: a problem, kindly, or that something worked. Read out when it appears. */
export function Notice({ tone = "alert", children }: { tone?: "alert" | "calm"; children: ReactNode }) {
  return (
    <p
      role={tone === "alert" ? "alert" : "status"}
      className={`text-small empty:hidden ${tone === "alert" ? "text-alert" : "text-sage"}`}
    >
      {children}
    </p>
  );
}
