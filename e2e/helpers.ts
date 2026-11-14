import { expect, type Locator, type Page } from "@playwright/test";

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

/** A phone's layout (one row of chips and "More"), rather than a tablet's or a desktop's (every chip, wrapped). */
export const onPhone = (page: Page) => (page.viewportSize()?.width ?? 0) < 768;

/** How far the page is taller than the screen: 0 when nothing needs scrolling. */
export const overflow = (page: Page) =>
  page.evaluate(() => Math.max(0, document.documentElement.scrollHeight - window.innerHeight));

/** The envelope's tag says "For Mary" by itself. The small pencil renames it in place. */
export async function renameEnvelope(scope: Page | Locator, title: string) {
  await scope.getByRole("button", { name: "Rename the envelope" }).click();
  const field = scope.getByLabel("Name on the envelope");
  await field.fill(title);
  await field.press("Enter");
  await expect(scope.getByRole("button", { name: "Rename the envelope" })).toBeVisible();
}

/**
 * Types the name on the first question, and makes sure it was heard.
 *
 * Known issue, left for later: on the development server, a name typed in the
 * first few milliseconds after the page wakes can be dropped (the field goes
 * blank again). Nobody types that fast, but a test does. So: type it, and if
 * the screen hasn't answered ("This is for Mary"), type it again.
 */
export async function nameThem(page: Page, name: string) {
  const field = page.getByLabel("Their name");
  await expect(async () => {
    await field.fill(name);
    await expect(page.getByRole("button", { name: `This is for ${name}` })).toBeVisible({ timeout: 1500 });
  }).toPass();
}

/** Onboarding opens on its first question: "Who came to mind?". */
export async function begin(page: Page) {
  await page.goto("/start");
  await expect(page).toHaveURL(/\/start\/someone$/);
  await expect(page.getByLabel("Their name")).toBeVisible();
}

/** Steps 1 and 2, with a letter: someone named, and something sealed for them. */
export async function sealALetter(page: Page, name = "Mary") {
  await nameThem(page, name);
  await page.getByText("Daughter", { exact: true }).click();
  await page.getByRole("button", { name: `This is for ${name}` }).click();
  await expect(page).toHaveURL(/\/start\/message$/);

  // Nothing to seal yet, so no button for it: it arrives with the first words.
  await page.getByRole("button", { name: "Write instead" }).click();
  await page.getByLabel(`Your letter to ${name}`).fill("You were the best thing that ever happened to me.");
  await page.getByRole("button", { name: `Seal it for ${name}` }).click();
  await expect(page.getByRole("heading", { name: `Sealed for ${name}.` })).toBeVisible();
}

/** All of onboarding, the quick way (a letter, skip the bank), ending on /home. */
export async function onboard(page: Page, email: string, name = "Mary") {
  await begin(page);
  await sealALetter(page, name);
  await page.getByRole("button", { name: "Continue", exact: true }).click();

  await expect(page).toHaveURL(/\/start\/keep-safe$/);
  await signInWithCode(page, email, "Keep it safe");

  // The last step for now: skipping it leads home.
  await expect(page).toHaveURL(/\/start\/find$/);
  await page.getByRole("button", { name: "Skip for now" }).click();

  await expect(page).toHaveURL(/\/home$/);
  await expect(page.getByRole("button", { name: new RegExp(`Open ${name}'s gifts`) })).toBeVisible();
}
