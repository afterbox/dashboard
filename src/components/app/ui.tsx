"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";
import { CloseIcon } from "./icons";
import "./app.css";

/**
 * The app's few controls, in the design system's tokens: the button, the icon
 * button, the chip, the field, the switch and the sheet. Every one is at least
 * 44px to touch and shows the focus ring.
 *
 * On a phone they are compact, so a screen never feels like a form: chips are
 * 36px tall (their touch area still 44px), icon buttons are 44px with a 20px
 * icon, and fields and the main button are 48px.
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

// ── Icon button ─────────────────────────────────────────────────────────────

type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label"> & {
  /** What it does, in words: its name for a screen reader, and its tooltip. */
  label: string;
  /** Which side the tooltip opens on. Choose the one with room: `right` at the left edge, `left` at the right. */
  tip?: "above" | "below" | "left" | "right";
  /** A ring round it: for a control that stands by itself, such as play. */
  ringed?: boolean;
  /**
   * The one big button: 88px, heartwood. Only for record (and stop, in the
   * same place), where being big is the point. Everything else stays small.
   */
  hero?: boolean;
};

const tipSides = {
  above: "bottom-full left-1/2 mb-1 -translate-x-1/2",
  below: "top-full left-1/2 mt-1 -translate-x-1/2",
  left: "top-1/2 right-full mr-1 -translate-y-1/2",
  right: "top-1/2 left-full ml-1 -translate-y-1/2",
};

/**
 * A button that is only an icon: for the few things an icon says at a glance
 * (./icons.tsx). 44px to touch, the icon about 20px. It always has a name, read
 * out by a screen reader and shown as a tooltip on hover and keyboard focus.
 */
export function IconButton({
  label,
  tip = "above",
  ringed = false,
  hero = false,
  className = "",
  children,
  type = "button",
  ...rest
}: IconButtonProps) {
  const look = hero
    ? "size-22 bg-heartwood text-on-heartwood hover:bg-heartwood-deep"
    : `size-11 text-ink ${ringed ? "border border-ink-muted hover:border-ink" : ""}`;
  return (
    <button
      type={type}
      aria-label={label}
      className={`group relative inline-flex shrink-0 items-center justify-center rounded-pill transition-[color,background-color,border-color,opacity] duration-200 ease-state disabled:opacity-50 ${look} ${className}`}
      {...rest}
    >
      {children}
      <span
        aria-hidden
        className={`pointer-events-none absolute z-20 rounded-sm bg-keepsake px-2 py-1 text-small whitespace-nowrap text-linen opacity-0 transition-opacity duration-200 ease-state group-hover:opacity-100 group-focus-visible:opacity-100 ${tipSides[tip]}`}
      >
        {label}
      </span>
    </button>
  );
}

/**
 * A small link that does something here, rather than going somewhere: "Write
 * instead", "Need an idea?". An icon in front where one helps say it. Quiet,
 * but still 44px to touch.
 */
export function LinkButton({
  icon,
  className = "",
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { icon?: ReactNode }) {
  return (
    <button
      type="button"
      className={`inline-flex min-h-11 items-center gap-1.5 text-left text-small font-medium text-ink disabled:opacity-50 ${className}`}
      {...rest}
    >
      {icon && <span className="text-ink-muted">{icon}</span>}
      <span className="underline decoration-line decoration-2 underline-offset-4">{children}</span>
    </button>
  );
}

// ── Chips: one choice from a few ────────────────────────────────────────────

/**
 * A chip. Compact on a phone: 36px tall, with its touch area reaching 4px past
 * it above and below, so it is still 44px to a thumb. From a tablet up, 44px.
 */
const chipLook =
  "relative inline-flex h-9 shrink-0 cursor-pointer items-center rounded-pill border border-ink-muted px-3.5 text-small font-medium whitespace-nowrap text-ink transition-colors duration-200 ease-state before:absolute before:inset-x-0 before:-inset-y-1 hover:border-ink md:h-11 md:px-4 md:text-label md:font-semibold";

type ChoiceChipProps<T extends string> = {
  name: string;
  value: T;
  checked: boolean;
  onChange: (value: T) => void;
  /** The choice is optional: tapping the chosen chip again lets it go. */
  onClear?: () => void;
  className?: string;
  children: ReactNode;
};

/** One choice among a few: a radio button, drawn as a chip. */
export function ChoiceChip<T extends string>({ name, value, checked, onChange, onClear, className = "", children }: ChoiceChipProps<T>) {
  return (
    <label
      className={`${chipLook} has-checked:border-keepsake has-checked:bg-keepsake has-checked:text-linen has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus ${className}`}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        onClick={() => checked && onClear?.()}
        className="sr-only"
      />
      {children}
    </label>
  );
}

/** A chip that does something, or is pressed in and out: "More", or a choice inside a sheet. */
export function ChipButton({ className = "", ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`${chipLook} aria-pressed:border-keepsake aria-pressed:bg-keepsake aria-pressed:text-linen ${className}`}
      {...rest}
    />
  );
}

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
          <ChoiceChip key={option.value} name={name} value={option.value} checked={value === option.value} onChange={onChange}>
            {option.label}
          </ChoiceChip>
        ))}
      </div>
    </fieldset>
  );
}

/**
 * A suggestion to tap: it fills something in, or offers an idea. Not a choice
 * that stays chosen. Compact on a phone, like a chip, with the same 44px touch area.
 */
export function Suggestion({ className = "", ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`relative inline-flex min-h-9 items-center rounded-pill border border-dashed border-ink-muted px-3.5 py-1.5 text-left text-small font-medium text-ink transition-colors duration-200 ease-state before:absolute before:inset-x-0 before:-inset-y-1 hover:border-ink aria-pressed:border-solid aria-pressed:border-keepsake aria-pressed:bg-blush md:min-h-11 md:px-4 ${className}`}
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
  /**
   * Keep the label for screen readers only: for a field that is alone under
   * its question, where the question has already asked. Give it a placeholder.
   */
  hideLabel?: boolean;
};

const fieldBox =
  "w-full rounded-md border border-ink-muted bg-paper px-4 text-ink placeholder:text-ink-muted/80 aria-invalid:border-alert";

function FieldFrame({
  id,
  label,
  hint,
  error,
  hideLabel = false,
  children,
}: FieldBase & { id: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className={hideLabel ? "sr-only" : "block text-label text-ink"}>
        {label}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="mt-1 text-small text-ink-muted">
          {hint}
        </p>
      )}
      <div className={hideLabel && !hint ? undefined : "mt-2"}>{children}</div>
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
  hideLabel = false,
  inviting = false,
  className = "",
  "aria-describedby": describedByToo,
  ...rest
}: FieldBase &
  InputHTMLAttributes<HTMLInputElement> & {
    /** The one field on a screen: its words a size larger, and from a tablet up a little taller. */
    inviting?: boolean;
  }) {
  const id = useId();
  return (
    <FieldFrame id={id} label={label} hint={hint} error={error} hideLabel={hideLabel}>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={[describedByToo, describedBy(id, hint, error)].filter(Boolean).join(" ") || undefined}
        className={`${fieldBox} ${inviting ? "h-12 text-body-l-mobile md:h-14 md:px-5 md:text-body-l" : "h-12"} ${
          handwritten ? "font-note text-note" : inviting ? "" : "text-body"
        } ${className}`}
        {...rest}
      />
    </FieldFrame>
  );
}

export function TextArea({
  label,
  hint,
  error,
  hideLabel = false,
  grows = false,
  className = "",
  ...rest
}: FieldBase &
  TextareaHTMLAttributes<HTMLTextAreaElement> & {
    /** Starts a few lines tall and grows with what is written, so there is never a box to scroll inside. */
    grows?: boolean;
  }) {
  const id = useId();
  const area = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = area.current;
    if (!grows || !el) return;
    el.style.height = "auto";
    // As tall as its words, plus its own border.
    el.style.height = `${el.scrollHeight + el.offsetHeight - el.clientHeight}px`;
  }, [grows, rest.value]);

  return (
    <FieldFrame id={id} label={label} hint={hint} error={error} hideLabel={hideLabel}>
      <textarea
        ref={area}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={`${fieldBox} block py-3 text-body ${grows ? "min-h-22 resize-none overflow-hidden short:min-h-20" : "min-h-40 resize-y"} ${className}`}
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

/** How far down a sheet must be pulled to close, or how briskly (px per ms) over a shorter pull. */
const pull = { far: 96, flick: 0.5, least: 24 };

/**
 * "Sheets, not modals": anything secondary rises from the bottom edge, on
 * paper. A native <dialog>, so focus is held inside it, Escape closes it, and
 * focus goes back where it was. Tapping outside closes it too, and so does
 * pulling it down by its handle or its heading.
 */
export function Sheet({ open, onClose, title, children }: SheetProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const pulling = useRef<{ from: number; at: number } | null>(null);
  const id = useId();

  // Swipe down to close. The sheet follows the finger (transform only); let go
  // far enough, or with a flick, and it closes; otherwise it settles back.
  const startPull = (event: ReactPointerEvent<HTMLDivElement>) => {
    const el = dialog.current;
    // Not from the close button: that is a tap, and must stay one.
    if (!el || (event.target as Element).closest("button") || (event.pointerType === "mouse" && event.button !== 0)) return;
    pulling.current = { from: event.clientY, at: event.timeStamp };
    event.currentTarget.setPointerCapture(event.pointerId);
    el.style.transition = "none";
  };
  const movePull = (event: ReactPointerEvent<HTMLDivElement>) => {
    const el = dialog.current;
    if (!el || !pulling.current) return;
    el.style.translate = `0 ${Math.max(0, event.clientY - pulling.current.from)}px`;
  };
  const endPull = (event: ReactPointerEvent<HTMLDivElement>) => {
    const el = dialog.current;
    const started = pulling.current;
    pulling.current = null;
    if (!el || !started) return;
    const far = event.clientY - started.from;
    const brisk = far / Math.max(1, event.timeStamp - started.at) > pull.flick;
    el.style.transition = "";
    el.style.translate = "";
    // Closing the dialog itself tells whoever opened it (onClose), as Escape does.
    if (event.type === "pointerup" && (far > pull.far || (far > pull.least && brisk))) el.close();
  };

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
      <div className="px-5 pb-[max(--spacing(6),env(safe-area-inset-bottom))] md:px-8">
        {/* The handle and the heading: where it is pulled down from. */}
        <div
          onPointerDown={startPull}
          onPointerMove={movePull}
          onPointerUp={endPull}
          onPointerCancel={endPull}
          className="touch-none pt-3 select-none"
        >
          <div aria-hidden className="mx-auto h-1 w-10 rounded-pill bg-line" />
          <div className="mt-3 flex items-start justify-between gap-4">
            <h2 id={id} className="pt-1.5 font-display text-display-s-mobile text-balance text-ink md:pt-1 md:text-display-s">
              {title}
            </h2>
            <IconButton label="Close" tip="left" onClick={onClose} className="-mr-3">
              <CloseIcon />
            </IconButton>
          </div>
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
