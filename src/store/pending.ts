/**
 * Something shown before the server has answered (a gift being sealed, a name
 * on its way to the shelf) needs an id until the real one arrives.
 */
const prefix = "pending:";
let count = 0;

/** Real id → the id it was first shown under. */
const shownAs = new Map<string, string>();

export const pendingId = () => `${prefix}${Date.now()}-${++count}`;

/** Still on its way: nothing can be done with it on the server yet. */
export const isPending = (id: string) => id.startsWith(prefix);

/** The server has answered: this is its real id. */
export const settle = (pending: string, real: string) => {
  shownAs.set(real, pending);
};

/**
 * A React key that does not change when the real id arrives, so the row stays
 * where it is and its entrance is not played a second time.
 */
export const stableKey = (id: string) => shownAs.get(id) ?? id;
