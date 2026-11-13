"use client";

import { useState, type FormEvent } from "react";
import { Button, Chips, Notice, Sheet, TextArea, TextField } from "@/components/app/ui";
import { ApiError, errorMessage } from "@/lib/api-client";
import { looksLikeSecret, noNumbersMessage } from "@/lib/no-numbers";
import { practicalCategories, type PracticalCategory, type PracticalItem } from "@/lib/schemas";
import { trustLines } from "@/lib/trust-lines";
import { isPending, pendingId, stableKey } from "@/store/pending";
import { useAddToShelf, useTakeOffShelf } from "@/store/shelf";

const categoryLabels: Record<PracticalCategory, string> = {
  bank: "Bank",
  insurance: "Insurance",
  pension: "Pension",
  property: "Home",
  crypto: "Crypto",
  wish: "A wish",
  other: "Something else",
};
const categories = practicalCategories.map((value) => ({ value, label: categoryLabels[value] }));

/** What to call the name field, so it asks for the right thing. */
const nameLabels: Record<PracticalCategory, string> = {
  bank: "The bank's name",
  insurance: "Who it's with",
  pension: "Who it's with",
  property: "What to call it",
  crypto: "Where it's kept",
  wish: "The wish, in a few words",
  other: "What to call it",
};

type Props = { items: PracticalItem[] };

/** What the form holds: kept if the server refuses, so nothing is typed twice. */
type Entry = { category: PracticalCategory | null; name: string; note: string };
type EntryErrors = { providerName?: string; note?: string; other?: string };

/**
 * "What they'll need to find": the practical shelf. Names of where things
 * are, never the keys to them. The bank from onboarding is already on it.
 *
 * Adding and removing show at once (src/store/shelf.ts). If the server
 * refuses, the shelf goes back to how it was and the sheet opens again with
 * what they typed and the reason.
 */
export function Shelf({ items }: Props) {
  const { mutate: add } = useAddToShelf();
  const { mutate: takeOff } = useTakeOffShelf();
  /** The add sheet: open, and what it starts with (after a refusal: what they typed, and why). */
  const [adding, setAdding] = useState<{ entry?: Entry; errors?: EntryErrors } | null>(null);
  /** The one being looked at, by its key on the shelf, and why it couldn't be taken off, if it couldn't. */
  const [looking, setLooking] = useState<{ key: string; error?: string } | null>(null);
  /** The one just added: it lands on the shelf. */
  const [landed, setLanded] = useState<string | null>(null);
  const lookingAt = looking ? items.find((item) => stableKey(item.id) === looking.key) : undefined;

  const addIt = (entry: Entry & { category: PracticalCategory }) => {
    const shownAs = pendingId();
    setLanded(shownAs);
    setAdding(null);
    add(
      { shownAs, input: { category: entry.category, providerName: entry.name, note: entry.note } },
      {
        onError: (problem) => {
          const fields = problem instanceof ApiError ? problem.fields : undefined;
          const errors = fields?.providerName || fields?.note ? fields : { other: errorMessage(problem) };
          setAdding({ entry, errors });
        },
      },
    );
  };

  const takeItOff = (item: PracticalItem) => {
    const key = stableKey(item.id);
    setLooking(null);
    takeOff(item, { onError: (problem) => setLooking({ key, error: errorMessage(problem) }) });
  };

  return (
    <section aria-labelledby="shelf-heading" className="mt-14 md:mt-24">
      <h2 id="shelf-heading" className="font-display text-display-m-mobile text-ink md:text-display-m">
        What they&apos;ll need to find
      </h2>
      <p className="mt-2 max-w-md text-body text-ink-muted">Just the names. Never numbers or passwords.</p>

      {/* shelf */}
      <ul className="mt-6 flex flex-wrap items-end gap-x-2 gap-y-0 border-b-2 border-ink px-2">
        {items.map((item) => (
          <li key={stableKey(item.id)} className={stableKey(item.id) === landed ? "shelf-item-new" : ""}>
            <button
              type="button"
              onClick={() => setLooking({ key: stableKey(item.id) })}
              className="flex min-h-14 flex-col justify-center rounded-t-sm border border-b-0 border-line bg-paper px-4 py-2 text-left"
            >
              <span className="text-label text-ink">{item.providerName}</span>
              <span className="text-small text-ink-muted">{categoryLabels[item.category]}</span>
            </button>
          </li>
        ))}
        <li>
          <button
            type="button"
            onClick={() => setAdding({})}
            className="flex min-h-14 items-center rounded-t-sm border border-b-0 border-dashed border-ink-muted px-4 py-2 text-label text-ink-muted transition-colors duration-200 ease-state hover:border-ink hover:text-ink"
          >
            Add something
          </button>
        </li>
      </ul>
      {items.length > 0 && (
        <p className="mt-3 text-small text-ink-muted">
          {items.length === 1 ? "One less thing" : `${items.length} fewer things`} for them to search for.
        </p>
      )}

      <Sheet open={adding !== null} onClose={() => setAdding(null)} title="Add something they'll need to find">
        {adding && <AddItem start={adding.entry} problems={adding.errors} onAdd={addIt} />}
      </Sheet>

      <Sheet open={Boolean(lookingAt)} onClose={() => setLooking(null)} title={lookingAt?.providerName ?? ""}>
        {lookingAt && <ItemDetail item={lookingAt} problem={looking?.error} onRemove={() => takeItOff(lookingAt)} />}
      </Sheet>
    </section>
  );
}

type AddItemProps = {
  start?: Entry;
  problems?: EntryErrors;
  onAdd: (entry: Entry & { category: PracticalCategory }) => void;
};

function AddItem({ start, problems, onAdd }: AddItemProps) {
  const [category, setCategory] = useState<PracticalCategory | null>(start?.category ?? null);
  const [name, setName] = useState(start?.name ?? "");
  const [note, setNote] = useState(start?.note ?? "");
  const [errors, setErrors] = useState<EntryErrors>(problems ?? {});

  const submit = (event: FormEvent) => {
    event.preventDefault();
    // Said straight away here; the server checks again, and that is the check that counts.
    const found = {
      ...(!category && { other: "Choose what kind of thing this is." }),
      ...(!name.trim() && { providerName: "Tell us the name." }),
      ...(looksLikeSecret(name) && { providerName: noNumbersMessage }),
      ...(looksLikeSecret(note, { allowYears: true }) && { note: noNumbersMessage }),
    };
    setErrors(found);
    if (Object.keys(found).length > 0 || !category) return;
    onAdd({ category, name, note });
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <Chips legend="What kind of thing is it?" showLegend name="category" options={categories} value={category} onChange={setCategory} />
      <TextField
        label={category ? nameLabels[category] : "Its name"}
        hint="Just the name. Never numbers or passwords."
        value={name}
        onChange={(event) => setName(event.target.value)}
        error={errors.providerName}
        maxLength={80}
        autoComplete="off"
      />
      <TextArea
        label="A note, if it helps"
        hint="Where to look, or who to ask. Optional."
        value={note}
        onChange={(event) => setNote(event.target.value)}
        error={errors.note}
        maxLength={500}
        className="min-h-24"
      />
      <p className="text-small text-ink-muted">{trustLines.passwords}</p>
      <div className="space-y-1">
        <Notice>{errors.other}</Notice>
        <Button type="submit" full>
          Add it to the shelf
        </Button>
      </div>
    </form>
  );
}

function ItemDetail({ item, problem, onRemove }: { item: PracticalItem; problem?: string; onRemove: () => void }) {
  return (
    <div>
      <p className="eyebrow text-ink-muted">{categoryLabels[item.category]}</p>
      <p className="mt-2 text-body whitespace-pre-wrap text-ink">
        {item.note ?? "No note. The name is enough for them to know where to look."}
      </p>
      <div className="mt-6 space-y-1">
        <Notice>{problem}</Notice>
        {/* Just added, and not yet answered: there is nothing on the server to take off until it is. */}
        <Button variant="outline" disabled={isPending(item.id)} onClick={onRemove}>
          Take it off the shelf
        </Button>
      </div>
    </div>
  );
}
