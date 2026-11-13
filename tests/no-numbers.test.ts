import { describe, expect, it } from "vitest";
import { findSecret, noNumbersMessage } from "@/lib/no-numbers";
import { practicalItemCreateSchema } from "@/lib/schemas";

describe("just the name: never numbers or passwords", () => {
  it.each([
    "Monzo",
    "Nationwide",
    "First Direct",
    "Barclays, joint account with Sam",
    "Aviva life insurance",
    "Scottish Widows pension",
    "Ledger wallet, in the desk drawer",
    "3 Mobile",
    "Lloyds (2 accounts)",
    "M&S Bank",
    "Halifax 123",
  ])("keeps a name: %s", (name) => {
    expect(findSecret(name)).toBeNull();
  });

  it.each([
    ["an account number", "Monzo 12345678", "digits"],
    ["an account number with spaces", "Monzo 1234 5678", "digits"],
    ["a sort code with dashes", "Barclays 20-45-77", "sort-code"],
    ["a sort code with spaces", "Barclays 20 45 77", "sort-code"],
    ["a sort code run together", "Barclays 204577", "digits"],
    ["a card number", "4242 4242 4242 4242", "card"],
    ["a card number with dashes", "card 5555-5555-5555-4444", "card"],
    ["a card number run together", "4242424242424242", "card"],
    ["an Amex card number", "3782 822463 10005", "card"],
    ["an IBAN", "GB29 NWBK 6016 1331 9268 19", "iban"],
    ["a PIN", "Monzo 2468", "digits"],
    ["a labelled PIN", "PIN 246", "labelled"],
    ["a password", "password: hunter2", "labelled"],
    ["a password, said plainly", "Password = Tr0ub4dor", "labelled"],
    ["a passcode", "passcode 9911", "labelled"],
    ["a login", "login: mary@example.com", "labelled"],
    ["a CVV", "cvv 123", "labelled"],
  ])("refuses %s", (_what, text, kind) => {
    expect(findSecret(text)).toBe(kind);
  });

  it("lets a note say where something is kept", () => {
    expect(findSecret("The password is in the red notebook", { allowYears: true })).toBeNull();
    expect(findSecret("Ask Sam about the account", { allowYears: true })).toBeNull();
  });

  it("lets a year through in a note, but not in a name", () => {
    expect(findSecret("Opened in 2019 with Sam", { allowYears: true })).toBeNull();
    expect(findSecret("Opened in 2019 with Sam")).toBe("digits");
    // A four-digit run that isn't a year is still refused in a note.
    expect(findSecret("The code is on the card, 4821", { allowYears: true })).toBe("digits");
  });

  describe("the practical item schema", () => {
    const parse = (input: unknown) => practicalItemCreateSchema.safeParse(input);

    it("accepts a name and a note", () => {
      const result = parse({ category: "bank", providerName: "  Monzo ", note: "Joint account, opened in 2019" });
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ category: "bank", providerName: "Monzo", note: "Joint account, opened in 2019" });
    });

    it.each([
      ["providerName", { category: "bank", providerName: "Monzo 12345678" }],
      ["providerName", { category: "bank", providerName: "20-45-77" }],
      ["providerName", { category: "other", providerName: "4242 4242 4242 4242" }],
      ["note", { category: "bank", providerName: "Monzo", note: "sort code 20-45-77, account 12345678" }],
      ["note", { category: "crypto", providerName: "Ledger", note: "password: correct horse battery staple" }],
      ["note", { category: "bank", providerName: "Monzo", note: "PIN 2468" }],
    ])("refuses a number or password in %s, kindly", (field, input) => {
      const result = parse(input);
      expect(result.success).toBe(false);
      const issue = result.error?.issues.find((i) => i.path[0] === field);
      expect(issue?.message).toBe(noNumbersMessage);
    });

    it("the kind message says what we never keep, without blame", () => {
      expect(noNumbersMessage).toMatch(/Just the name is enough/);
      expect(noNumbersMessage).toMatch(/never keep account numbers, card numbers, PINs or passwords/);
    });

    it("refuses a category it doesn't know", () => {
      expect(parse({ category: "video", providerName: "Monzo" }).success).toBe(false);
    });
  });
});
