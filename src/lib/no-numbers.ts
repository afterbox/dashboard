/**
 * "Just the name. Never numbers or passwords."
 *
 * afterbox keeps where things are, never the keys to them: no account
 * numbers, sort codes, card numbers, PINs or passwords. This looks for
 * anything that seems to be one, so it can be refused, kindly, before it is
 * ever stored. It runs in the browser (to say so straight away) and again on
 * the server (which is the one that counts).
 *
 * It errs on the side of refusing: a wrongly refused note costs a moment; a
 * stored card number can't be taken back.
 */

export const noNumbersMessage =
  "That looks like a number or a password. Just the name is enough: we never keep account numbers, card numbers, PINs or passwords.";

/** What it looked like, for tests and for logs that must never hold the text itself. */
export type SecretKind = "card" | "sort-code" | "iban" | "digits" | "labelled";

/** Digits, with the spaces, dots and dashes people put between groups of them. */
const digitGroups = /\d(?:[\s.\-–—/]{0,2}\d)*/g;
/** A UK sort code: 12-34-56, 12 34 56. */
const sortCode = /(?<!\d)\d{2}[\s.\-–—]\d{2}[\s.\-–—]\d{2}(?!\d)/;
/** An IBAN, with or without spaces: GB29 NWBK 6016 1331 9268 19. */
const iban = /\b[A-Z]{2}\d{2}(?:\s?[A-Z0-9]{4}){2,7}(?:\s?[A-Z0-9]{1,4})?\b/i;
/**
 * A label and then a value: "PIN 2468", "password: hunter2", "sort code = …".
 * Saying where something is kept is fine and useful ("the password is in the
 * red notebook"), so a label only counts when a colon, an equals sign or a
 * digit follows it.
 */
const labelled =
  /\b(?:pin|pass\s?word|pass\s?code|pass\s?phrase|pwd|cvv|cvc|security code|sort code|account (?:number|no\.?|num)|acc(?:ount)? ?(?:no\.?|#)|card (?:number|no\.?)|iban|swift|seed(?: phrase)?|recovery (?:phrase|key)|private key|log\s?in|user\s?name)\b\s*(?:(?:is|=|:|#)\s*)?(?:[:=#]\s*\S|\d)/i;

type Options = {
  /**
   * Let a year through ("opened in 2019"). For notes. A provider's name has no
   * need of one, so there every run of four digits is refused.
   */
  allowYears?: boolean;
};

const isYear = (digits: string) => digits.length === 4 && Number(digits) >= 1900 && Number(digits) <= 2099;

/** What kind of number or password this seems to hold, or null if it looks safe to keep. */
export function findSecret(text: string, { allowYears = false }: Options = {}): SecretKind | null {
  if (sortCode.test(text)) return "sort-code";
  if (iban.test(text) && /\d{4}/.test(text.replace(/\s/g, ""))) return "iban";
  if (labelled.test(text)) return "labelled";

  for (const [group] of text.matchAll(digitGroups)) {
    const digits = group.replace(/\D/g, "");
    // Card numbers are 13 to 19 digits, however they are spaced.
    if (digits.length >= 13) return "card";
    // Account numbers (8), sort codes run together (6), long PINs and codes.
    if (digits.length >= 6) return "digits";
    // One unbroken run of four or five: a PIN, unless it reads as a year in a note.
    for (const run of group.match(/\d{4,}/g) ?? []) {
      if (allowYears && isYear(run)) continue;
      return "digits";
    }
  }
  return null;
}

export const looksLikeSecret = (text: string, options?: Options) => findSecret(text, options) !== null;
