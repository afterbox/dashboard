/**
 * The trust lines. Trust is the product, so these promises are always worded
 * the same way (docs/design-system.md, "Trust lines"). Never retype them:
 * read them from here.
 */
export const trustLines = {
  sealed: "Not even afterbox can open your vault.",
  data: "We never sell your data.",
  passwords: "We never ask for passwords, PINs or card numbers.",
  advice: "We guide you. We don't give legal or financial advice.",
} as const;

/** The three promises about what is kept, in the order they are always given. */
export const promises = [trustLines.sealed, trustLines.data, trustLines.passwords] as const;
