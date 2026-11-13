import { expect, test } from "@playwright/test";
import { newEmail, onboard, signInWithCode } from "./helpers";

test("someone who has finished signs in again and lands on /home, skipping onboarding", async ({ page, browser }) => {
  const email = newEmail("returning");
  await onboard(page, email);

  // Another device: no session at all.
  const context = await browser.newContext();
  const fresh = await context.newPage();
  await fresh.goto("/home");
  await expect(fresh).toHaveURL(/\/start\/someone$/);

  await fresh.getByRole("link", { name: "Sign in" }).click();
  await expect(fresh).toHaveURL(/\/signin$/);
  await expect(fresh.getByRole("heading", { name: "Welcome back." })).toBeVisible();
  await expect(fresh.getByRole("button", { name: "Continue with Google" })).toHaveCount(0);
  await signInWithCode(fresh, email, "Sign in");

  await expect(fresh).toHaveURL(/\/home$/);
  await expect(fresh.getByRole("button", { name: /Open Mary's gifts/ })).toBeVisible();

  // Signed in and finished: onboarding and sign-in both lead home.
  await fresh.goto("/start");
  await expect(fresh).toHaveURL(/\/home$/);
  await fresh.goto("/signin");
  await expect(fresh).toHaveURL(/\/home$/);

  // And the landing page's buttons now say so, and go straight there.
  await fresh.goto("/");
  const way = fresh.getByRole("link", { name: "Go to your gifts" }).first();
  await expect(way).toBeVisible();
  await expect(fresh.getByRole("link", { name: "Build their gift" })).toHaveCount(0);
  await way.click();
  await expect(fresh).toHaveURL(/\/home$/);

  // Signing out ends it: /home is closed again, and the landing page is back to its first words.
  await fresh.getByRole("button", { name: "Your account" }).click();
  await fresh.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(fresh).toHaveURL(/\/$/);
  await expect(fresh.getByRole("link", { name: "Build their gift" }).first()).toBeVisible();
  // The account sheet was open when they left. The landing page still answers to a click.
  await fresh.getByRole("link", { name: "Build their gift" }).first().click();
  await expect(fresh).toHaveURL(/\/start\/someone$/);
  await fresh.goto("/home");
  await expect(fresh).toHaveURL(/\/start\/someone$/);
  await context.close();
});

test("on the free plan, a second person opens the warm offer, not an error", async ({ page }) => {
  await onboard(page, newEmail("offer"));

  await page.getByRole("button", { name: "Add someone you love" }).click();
  const sheet = page.getByRole("dialog", { name: "Who else would you build one for?" });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByRole("button", { name: /Build gifts for everyone/ })).toBeVisible();
  await expect(sheet.getByRole("button", { name: /Keep going free/ })).toBeVisible();
  await expect(sheet.getByText("Whatever you choose, Mary's message will always reach her.")).toBeVisible();
  await expect(sheet.getByRole("alert").filter({ hasText: /./ })).toHaveCount(0);

  // The server holds the same line, whatever the page does: one person on the free plan.
  const refused = await page.request.post("/api/people", {
    data: { name: "Tom", relationship: "son" },
    headers: { origin: new URL(page.url()).origin },
  });
  expect(refused.status()).toBe(402);
  expect((await refused.json()).error.code).toBe("upgrade_required");

  await sheet.getByRole("button", { name: /Build gifts for everyone/ }).click();
  await expect(sheet.getByText("Paid plans open soon. We'll save your place and let you know.")).toBeVisible();
  await sheet.getByRole("button", { name: "Back to your gifts" }).click();

  // Nothing was taken away: Mary and her gift are still there.
  await expect(page.getByRole("button", { name: /Open Mary's gifts/ })).toBeVisible();
});

test("the practical shelf takes names, and kindly refuses numbers", async ({ page }) => {
  await onboard(page, newEmail("shelf"));

  await page.getByRole("button", { name: "Add something" }).click();
  const sheet = page.getByRole("dialog", { name: "Add something they'll need to find" });
  await sheet.getByText("Pension", { exact: true }).click();
  await sheet.getByLabel("Who it's with").fill("Aviva 4929 1234 5678 9012");
  await sheet.getByRole("button", { name: "Add it to the shelf" }).click();
  await expect(sheet.getByText("That looks like a number or a password.")).toBeVisible();

  await sheet.getByLabel("Who it's with").fill("Aviva");
  await sheet.getByLabel("A note, if it helps").fill("The letters are in the blue folder.");
  await sheet.getByRole("button", { name: "Add it to the shelf" }).click();
  await expect(page.getByRole("button", { name: /Aviva/ })).toBeVisible();
});

test("the theme toggle is remembered, on this device and on the next", async ({ page, browser }) => {
  const email = newEmail("theme");
  await onboard(page, email);
  const html = page.locator("html");

  // System to begin with: nothing set.
  await expect(html).not.toHaveAttribute("data-theme");
  await page.getByTitle("Dark").click();
  await expect(html).toHaveAttribute("data-theme", "dark");

  // Still dark after a refresh, set before the page paints.
  await page.reload();
  await expect(html).toHaveAttribute("data-theme", "dark");
  await expect(page.getByRole("radio", { name: "Dark" }).first()).toBeChecked();

  // And on another device, once signed in: the choice is saved with their preferences.
  const context = await browser.newContext();
  const other = await context.newPage();
  await other.goto("/signin");
  await signInWithCode(other, email, "Sign in");
  await expect(other).toHaveURL(/\/home$/);
  await expect(other.locator("html")).toHaveAttribute("data-theme", "dark");

  // The same toggle is in the settings sheet. Back to System clears it.
  await other.getByRole("button", { name: "Your account" }).click();
  const sheet = other.getByRole("dialog", { name: "Your account" });
  await sheet.getByText("System", { exact: true }).click();
  await expect(sheet.getByRole("radio", { name: "System" })).toBeChecked();
  await expect(other.locator("html")).not.toHaveAttribute("data-theme");
  await context.close();
});
