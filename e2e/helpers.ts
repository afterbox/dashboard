import { expect, type Page } from "@playwright/test";

/** A fresh address each time, so tests never share an account or a code limit. */
export const newEmail = (label: string) =>
  `${label}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;

/**
 * The sign-in code last sent to an address, read from the test-only hook.
 * /api/test/otp exists only in end-to-end test mode; in production it is a 404,
 * and codes are never read from logs.
 */
export async function codeFor(page: Page, email: string) {
  const response = await page.request.get(`/api/test/otp?email=${encodeURIComponent(email)}`);
  expect(response.ok(), "the test-only code hook answers in test mode").toBe(true);
  const { code } = (await response.json()) as { code: string };
  expect(code).toMatch(/^\d{6}$/);
  return code;
}

/** Email, then the 6-digit code: on the "keep it safe" screen, or on /signin. */
export async function signInWithCode(page: Page, email: string, finish: "Keep it safe" | "Sign in") {
  await page.getByLabel("Your email").fill(email);
  await page.getByRole("button", { name: "Send my code" }).click();
  const field = page.getByLabel("Your 6-digit code");
  await expect(field).toBeVisible();
  await field.fill(await codeFor(page, email));
  await page.getByRole("button", { name: finish, exact: true }).click();
}

/** Onboarding opens on its first question: "Who came to mind?". */
export async function begin(page: Page) {
  await page.goto("/start");
  await expect(page).toHaveURL(/\/start\/someone$/);
  await expect(page.getByLabel("Their name")).toBeVisible();
}

/** Steps 1 and 2, with a letter: someone named, and something sealed for them. */
export async function sealALetter(page: Page, name = "Mary") {
  await page.getByLabel("Their name").fill(name);
  await page.getByText("Daughter", { exact: true }).click();
  await page.getByRole("button", { name: `This is for ${name}` }).click();
  await expect(page).toHaveURL(/\/start\/message$/);

  await page.getByRole("button", { name: "Write it instead" }).click();
  await page.getByLabel(`Your letter to ${name}`).fill("You were the best thing that ever happened to me.");
  await page.getByRole("button", { name: `Seal it for ${name}` }).click();
  await expect(page.getByRole("heading", { name: `Sealed for ${name}.` })).toBeVisible();
}

/** All of onboarding, the quick way (a letter, add later, skip), ending on /home. */
export async function onboard(page: Page, email: string, name = "Mary") {
  await begin(page);
  await sealALetter(page, name);
  await page.getByRole("button", { name: "Continue", exact: true }).click();

  await expect(page).toHaveURL(/\/start\/keep-safe$/);
  await signInWithCode(page, email, "Keep it safe");

  await expect(page).toHaveURL(/\/start\/reach$/);
  await page.getByRole("button", { name: "Add later" }).click();

  await expect(page).toHaveURL(/\/start\/find$/);
  await page.getByRole("button", { name: "Skip for now" }).click();

  await expect(page).toHaveURL(/\/start\/nudges$/);
  await page.getByRole("button", { name: "Continue", exact: true }).click();

  await expect(page).toHaveURL(/\/home$/);
  await expect(page.getByRole("button", { name: new RegExp(`Open ${name}'s gifts`) })).toBeVisible();
}
