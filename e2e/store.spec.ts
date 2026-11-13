import { expect, test, type Page, type Route } from "@playwright/test";
import { newEmail, onboard, signInWithCode } from "./helpers";

/*
  The store (src/store): what is shown before the server answers, what is put
  back when it refuses, which lists are asked for again, and what is forgotten
  when someone leaves.
*/

// Each kept as one function, so a route put on with it can be taken off with it.
const shelfApi = (url: URL) => url.pathname === "/api/practical-items";
const giftsApi = (url: URL) => url.pathname === "/api/gifts";

/** Every GET to /api from here on, by path. */
function watchReads(page: Page) {
  const asked: string[] = [];
  page.on("request", (request) => {
    const { pathname } = new URL(request.url());
    if (request.method() === "GET" && pathname.startsWith("/api/")) asked.push(pathname);
  });
  return asked;
}

/** Keep the server's answer to one kind of request back until it is let go, so the moment in between can be looked at. */
async function holdBack(page: Page, method: string, api: (url: URL) => boolean) {
  let letGo!: () => void;
  const released = new Promise<void>((done) => (letGo = done));
  let seen!: () => void;
  const sent = new Promise<void>((done) => (seen = done));
  const handler = async (route: Route) => {
    if (route.request().method() !== method) return route.continue();
    seen();
    await released;
    await route.continue();
  };
  await page.route(api, handler);
  return { sent, letGo };
}

async function fillShelfSheet(page: Page) {
  await page.getByRole("button", { name: "Add something" }).click();
  const sheet = page.getByRole("dialog", { name: "Add something they'll need to find" });
  await sheet.getByText("Pension", { exact: true }).click();
  await sheet.getByLabel("Who it's with").fill("Aviva");
  await sheet.getByLabel("A note, if it helps").fill("The letters are in the blue folder.");
  return sheet;
}

test("onboarding fetches what /home shows, so /home opens without asking again", async ({ page }) => {
  const asked = watchReads(page);
  await onboard(page, newEmail("store-home"));

  await expect(page.getByRole("button", { name: /Open Mary's gifts/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "What they'll need to find" })).toBeVisible();
  // Once each, on onboarding's last step. /home read the same copies.
  for (const list of ["/api/people", "/api/gifts", "/api/practical-items"]) {
    expect(asked.filter((path) => path === list), list).toHaveLength(1);
  }
});

test("something added to the shelf is there before the server answers, and only the shelf is refreshed", async ({ page }) => {
  await onboard(page, newEmail("store-shelf"));
  const asked = watchReads(page);
  const saving = await holdBack(page, "POST", shelfApi);

  const sheet = await fillShelfSheet(page);
  await sheet.getByRole("button", { name: "Add it to the shelf" }).click();

  // Sent, not yet answered: the sheet has closed and it is on the shelf already.
  await saving.sent;
  await expect(sheet).toBeHidden();
  await expect(page.getByRole("button", { name: /Aviva/ })).toBeVisible();
  await expect(page.getByText("One less thing for them to search for.")).toBeVisible();

  saving.letGo();
  await expect.poll(() => asked).toContain("/api/practical-items");
  await expect(page.getByRole("button", { name: /Aviva/ })).toBeVisible();
  // People, gifts and the session were left alone.
  expect(asked.filter((path) => path !== "/api/practical-items")).toEqual([]);

  // And it really was saved.
  await page.reload();
  await expect(page.getByRole("button", { name: /Aviva/ })).toBeVisible();
});

test("if the server refuses, the shelf goes back and the sheet opens again with what was typed", async ({ page }) => {
  await onboard(page, newEmail("store-refused"));
  const refuse = (route: Route) =>
    route.request().method() === "POST"
      ? route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: { code: "server_error", message: "Something went wrong on our side. Nothing was lost. Try again in a moment." } }),
        })
      : route.continue();
  await page.route(shelfApi, refuse);

  const sheet = await fillShelfSheet(page);
  await sheet.getByRole("button", { name: "Add it to the shelf" }).click();

  await expect(sheet.getByText("Something went wrong on our side.")).toBeVisible();
  await expect(sheet.getByLabel("Who it's with")).toHaveValue("Aviva");
  await expect(sheet.getByLabel("A note, if it helps")).toHaveValue("The letters are in the blue folder.");
  await expect(page.getByRole("button", { name: /Aviva/ })).toHaveCount(0);

  // Trying again, once the server is well.
  await page.unroute(shelfApi, refuse);
  await sheet.getByRole("button", { name: "Add it to the shelf" }).click();
  await expect(sheet).toBeHidden();
  await expect(page.getByRole("button", { name: /Aviva/ })).toBeVisible();
});

test("a new gift joins at once, and one that can't be sealed is kept to try again", async ({ page }) => {
  await onboard(page, newEmail("store-gift"));
  const box = page.getByRole("button", { name: /Open Mary's gifts/ });
  await box.click();
  const sheet = page.getByRole("dialog", { name: "For Mary" });
  const letter = sheet.getByLabel("Your letter to Mary");

  await sheet.getByRole("button", { name: "Add another for Mary" }).click();
  await sheet.getByRole("button", { name: "Write it instead" }).click();
  await letter.fill("Remember the blue bicycle.");
  await sheet.getByLabel("Name the envelope").fill("For Mary, about the bicycle");

  // The first try can't reach the server.
  const cutOff = (route: Route) => (route.request().method() === "POST" ? route.abort() : route.continue());
  await page.route(giftsApi, cutOff);
  await sheet.getByRole("button", { name: "Seal it for Mary" }).click();

  // It comes back with the words still in it, and says why.
  await expect(letter).toHaveValue("Remember the blue bicycle.");
  await expect(sheet.getByText("We couldn't reach afterbox.")).toBeVisible();
  await expect(sheet.getByText("This one isn't sealed yet.")).toBeVisible();

  // Closing the sheet doesn't lose it either: her card says so, and opens it again.
  await sheet.getByRole("button", { name: "Close" }).click();
  await expect(box).toHaveAccessibleName(/1 gift\b/);
  const waiting = page.getByRole("button", { name: /isn't sealed yet/ });
  await expect(waiting).toBeVisible();
  await waiting.click();
  await expect(letter).toHaveValue("Remember the blue bicycle.");

  // This time it goes through. Held for a moment, to see it in the list before the server has answered.
  await page.unroute(giftsApi, cutOff);
  const sealing = await holdBack(page, "POST", giftsApi);
  await sheet.getByRole("button", { name: "Seal it for Mary" }).click();
  await sealing.sent;
  await expect(sheet.getByText("For Mary, about the bicycle")).toBeVisible();
  await expect(sheet.getByText("Sealing…")).toBeVisible();

  sealing.letGo();
  await expect(sheet.getByText("Sealed for Mary. Only she will read it, when the time comes.")).toBeVisible();
  await expect(sheet.getByText("Sealing…")).toHaveCount(0);
  await sheet.getByRole("button", { name: "Close" }).click();
  await expect(waiting).toHaveCount(0);
  await expect(box).toHaveAccessibleName(/2 gifts/);

  // And it really was sealed.
  await page.reload();
  await expect(page.getByRole("button", { name: /Open Mary's gifts/ })).toHaveAccessibleName(/2 gifts/);
});

test("someone found signed out is sent to sign in, and whoever is next sees only their own", async ({ page, browser }) => {
  // Tom's dad has an account too.
  const next = newEmail("store-next");
  const context = await browser.newContext();
  await onboard(await context.newPage(), next, "Tom");
  await context.close();

  await onboard(page, newEmail("store-left"));
  // Signed out from somewhere else, with /home still open.
  await page.context().clearCookies();
  const sheet = await fillShelfSheet(page);
  await sheet.getByRole("button", { name: "Add it to the shelf" }).click();
  await expect(page).toHaveURL(/\/signin$/);

  // Someone else signs in on the same device, with no page load in between.
  await signInWithCode(page, next, "Sign in");
  await expect(page).toHaveURL(/\/home$/);
  await expect(page.getByRole("button", { name: /Open Tom's gifts/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Open Mary's gifts/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Aviva/ })).toHaveCount(0);
});
