/**
 * PLACEHOLDER. The key, in the three pieces it splits into: the bow (the
 * round end you hold), the shaft, and the bit (the end with the teeth).
 *
 * Each piece is drawn on its own small board, 64 × 40, lying on its side with
 * the bow to the left, and cut square where it meets the next, so the three
 * sit edge to edge as one key and come apart cleanly. Linen, cut out of the
 * keepsake band; no outline.
 *
 * ./sealed.css moves them. On a phone the whole key stands upright (each
 * piece is turned a quarter turn) and comes apart top to bottom.
 */
const pieces = [
  // The bow, and the start of the shaft.
  <path
    key="bow"
    fillRule="evenodd"
    d="M20 4a16 16 0 1 0 0 32a16 16 0 0 0 0 -32zM20 13a7 7 0 1 1 0 14a7 7 0 0 1 0 -14zM34 15h30v10h-30z"
  />,
  // The shaft.
  <path key="shaft" d="M0 15h64v10h-64z" />,
  // The bit: the end of the shaft, rounded off, and two teeth.
  <path key="bit" d="M0 15h54a5 5 0 0 1 0 10h-6v8h-8v-8h-6v11h-8v-11h-26z" />,
];

export function KeyPiece({ part }: { part: 0 | 1 | 2 }) {
  return (
    <svg viewBox="0 0 64 40" aria-hidden focusable="false" className="block size-full fill-linen">
      {pieces[part]}
    </svg>
  );
}

/** Who holds a piece of the key each. None can open the box alone. */
export const holders = [
  { name: "Your executor", note: "Jo, the person you chose." },
  { name: "A verified death certificate", note: "Checked before anything opens." },
  { name: "afterbox", note: "Our piece opens nothing alone." },
] as const;
