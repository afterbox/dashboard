"use client";

import { useState, type KeyboardEvent } from "react";
import { Button, ChipButton, ChoiceChip, Sheet, TextField } from "./ui";

type Option<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  /** What is being chosen: shown above the chips unless `hideLegend`, and the heading of the "More" sheet. */
  legend: string;
  hideLegend?: boolean;
  name: string;
  /** Every choice, the most common first. */
  options: readonly Option<T>[];
  /** How many show in the row on a phone. The rest wait behind "More". */
  first?: number;
  value: T | null;
  onChange: (value: T | null) => void;
  /** The choice is optional: tapping the chosen chip again lets it go. */
  optional?: boolean;
  /**
   * The choice that means "none of these", which takes a word of their own
   * ("Someone else" → "Godmother"). The word is optional too.
   */
  own?: {
    value: T;
    word: string;
    onWord: (word: string) => void;
    /** What the field is for, for screen readers. */
    label: string;
    placeholder: string;
    /** The longest their word may be. 40 unless said. */
    maxLength?: number;
    /** Whether their word may stand in for the chip's label. (Not if it looks like something we never keep.) */
    showWord?: boolean;
  };
};

/**
 * One choice from several, without the crowd.
 *
 * On a phone: a single row of compact chips, the most common few and a "More"
 * chip, scrolling sideways out to the screen's edge rather than wrapping. "More"
 * opens a sheet with the rest; one tap there chooses and closes. From a tablet
 * up there is room, so every choice shows in one wrapped group and there is no
 * sheet.
 *
 * It is one set of radio buttons whichever way it is drawn, so the keyboard and
 * screen readers get the same thing on every screen.
 */
export function ChoiceRow<T extends string>({
  legend,
  hideLegend = false,
  name,
  options,
  first = 4,
  value,
  onChange,
  optional = false,
  own,
}: Props<T>) {
  const [more, setMore] = useState(false);
  const common = options.slice(0, first);
  const rest = options.slice(first);
  const ownWord = own?.word.trim() ?? "";
  const labelOf = (option: Option<T>) =>
    own && option.value === own.value && ownWord && own.showWord !== false ? ownWord : option.label;

  return (
    <>
      <fieldset className="min-w-0">
        <legend className={hideLegend ? "sr-only" : "max-w-full truncate text-body text-ink-muted"}>{legend}</legend>
        {/* A phone: one row that scrolls sideways, out to the screen's edge. From a tablet up: every choice, wrapped. */}
        <div
          className={`chip-row -mx-5 flex gap-2 overflow-x-auto px-5 py-1.5 md:mx-0 md:flex-wrap md:overflow-visible md:px-0 ${
            hideLegend ? "-my-1.5" : "mt-0.5 -mb-1.5"
          }`}
        >
          {options.map((option) => {
            const chosen = value === option.value;
            // One from behind "More", once chosen, comes to the front of the row.
            const place = common.includes(option) ? "" : chosen ? "max-md:order-first" : "max-md:hidden";
            return (
              <ChoiceChip
                key={option.value}
                name={name}
                value={option.value}
                checked={chosen}
                onChange={onChange}
                onClear={optional ? () => onChange(null) : undefined}
                className={place}
              >
                {labelOf(option)}
              </ChoiceChip>
            );
          })}
          {rest.length > 0 && (
            <ChipButton aria-haspopup="dialog" onClick={() => setMore(true)} className="md:hidden">
              More
            </ChipButton>
          )}
        </div>
        {/* From a tablet up there is no sheet: their own word is asked for here. */}
        {own && value === own.value && (
          <div className="reveal mt-4 max-md:hidden">
            <TextField
              label={own.label}
              hideLabel
              placeholder={own.placeholder}
              value={own.word}
              onChange={(event) => own.onWord(event.target.value)}
              maxLength={own.maxLength ?? 40}
              autoComplete="off"
            />
          </div>
        )}
      </fieldset>

      <Sheet open={more} onClose={() => setMore(false)} title={legend}>
        <MoreChoices
          options={rest}
          chosen={value}
          own={own}
          onChoose={(chosen, word) => {
            onChange(chosen);
            own?.onWord(word);
            setMore(false);
          }}
        />
      </Sheet>
    </>
  );
}

type MoreProps<T extends string> = Pick<Props<T>, "own"> & {
  options: readonly Option<T>[];
  chosen: T | null;
  onChoose: (value: T, ownWord: string) => void;
};

/**
 * The rest of the choices, in the sheet. One tap chooses and closes. The one
 * that takes a word of their own opens a short field for it first.
 */
function MoreChoices<T extends string>({ options, chosen, own, onChoose }: MoreProps<T>) {
  const [ownOpen, setOwnOpen] = useState(Boolean(own && chosen === own.value));
  const [word, setWord] = useState(own?.word ?? "");

  const keep = () => {
    if (own) onChoose(own.value, word.trim());
  };
  // Not a form of its own: this sheet may sit inside one, and Enter here must not send that.
  const enter = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    keep();
  };

  return (
    <div>
      <div role="group" className="flex flex-wrap gap-2">
        {options.map((option) =>
          own && option.value === own.value ? (
            <ChipButton key={option.value} aria-pressed={ownOpen} onClick={() => setOwnOpen(true)}>
              {option.label}
            </ChipButton>
          ) : (
            <ChipButton
              key={option.value}
              aria-pressed={!ownOpen && chosen === option.value}
              onClick={() => onChoose(option.value, "")}
            >
              {option.label}
            </ChipButton>
          ),
        )}
      </div>
      {own && ownOpen && (
        <div className="reveal mt-5 flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <TextField
              label={own.label}
              hideLabel
              placeholder={own.placeholder}
              value={word}
              onChange={(event) => setWord(event.target.value)}
              onKeyDown={enter}
              maxLength={own.maxLength ?? 40}
              autoComplete="off"
              autoFocus
              enterKeyHint="done"
            />
          </div>
          <Button onClick={keep}>Done</Button>
        </div>
      )}
    </div>
  );
}
