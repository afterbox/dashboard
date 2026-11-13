import { expect, test } from "@playwright/test";
import { begin, newEmail, sealALetter, signInWithCode } from "./helpers";

test("a new person goes through all of onboarding and lands on /home", async ({ page }) => {
  const email = newEmail("new");

  // 1. Who came to mind? The first screen. Nobody is asked who they are yet, and
  // nothing is kept until they answer. The heading takes focus; the name appears on the box's tag.
  await page.goto("/start");
  await expect(page).toHaveURL(/\/start\/someone$/);
  const question = page.getByRole("heading", { name: "Think of someone you love. Who came to mind first?" });
  await expect(question).toBeFocused();
  await expect(page.getByRole("img", { name: "Step 1 of 7" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Back" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
  expect((await page.context().cookies()).some((cookie) => cookie.name.includes("session_token"))).toBe(false);
  await page.getByLabel("Their name").fill("Mary");
  await expect(page.locator(".gift-tag")).toHaveText("Mary");
  await page.getByText("Daughter", { exact: true }).click();
  await page.getByRole("button", { name: "This is for Mary" }).click();

  // 2. Say something to them: a voice note, recorded, stopped, and sealed.
  await expect(page).toHaveURL(/\/start\/message$/);
  await expect(page.getByRole("heading", { name: "Say something to Mary. Something only you could say." })).toBeFocused();
  await page.getByRole("button", { name: "What to remember on a hard day" }).click();
  await expect(page.getByLabel("Name the envelope")).toHaveValue("For Mary, on a hard day");
  await page.getByRole("button", { name: "Record a voice note", exact: true }).click();
  await expect(page.getByRole("timer")).toBeVisible();
  await page.waitForTimeout(2200);
  await page.getByRole("button", { name: "Stop" }).click();
  await expect(page.getByRole("button", { name: "Play your voice note" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Record again" })).toBeVisible();
  await page.getByRole("button", { name: "Seal it for Mary" }).click();
  await expect(page.getByRole("heading", { name: "Sealed for Mary." })).toBeVisible();
  await expect(page.getByText("Only she will hear it, when the time comes.")).toBeVisible();
  await page.getByRole("button", { name: "Continue", exact: true }).click();

  // 3. Keep it safe: sign-up comes only now. The trust lines, word for word.
  await expect(page).toHaveURL(/\/start\/keep-safe$/);
  await expect(page.getByRole("heading", { name: "Let's keep this safe for Mary." })).toBeVisible();
  await expect(page.getByText("Not even afterbox can open your vault.")).toBeVisible();
  await expect(page.getByText("We never sell your data.")).toBeVisible();
  await signInWithCode(page, email, "Keep it safe");

  // 4. Reaching them: optional, and "Add later" is as much a button as "Save".
  await expect(page).toHaveURL(/\/start\/reach$/);
  await expect(page.getByRole("link", { name: "Sign in" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Add later" })).toBeVisible();
  await page.getByLabel("Mary's email").fill("mary@example.com");
  await page.getByRole("button", { name: "Save", exact: true }).click();

  // 5. One thing they'd need to find: a name, never a number.
  await expect(page).toHaveURL(/\/start\/find$/);
  await page.getByText("Other", { exact: true }).click();
  await page.getByLabel("The bank's name").fill("12-34-56 12345678");
  await page.getByRole("button", { name: /^Add / }).click();
  await expect(page.getByText("That looks like a number or a password.")).toBeVisible();
  await page.getByText("Barclays", { exact: true }).click();
  await page.getByRole("button", { name: "Add Barclays" }).click();
  await expect(page.getByText("One less thing for them to search for.")).toBeVisible();
  await page.getByRole("button", { name: "Continue", exact: true }).click();

  // 6. Gentle nudges: on to begin with.
  await expect(page).toHaveURL(/\/start\/nudges$/);
  await expect(page.getByRole("switch", { name: "Reminder emails" })).toBeChecked();
  await page.getByRole("button", { name: "Continue", exact: true }).click();

  // 7. Who else? Two equal choices and the promise. Paid records interest and says so.
  await expect(page).toHaveURL(/\/start\/everyone$/);
  await expect(page.getByText("Whatever you choose, Mary's message will always reach her.")).toBeVisible();
  await page.getByRole("button", { name: /Build gifts for everyone/ }).click();
  await expect(page.getByText("Paid plans open soon. We'll save your place and let you know.")).toBeVisible();
  await page.getByRole("button", { name: "Continue", exact: true }).click();

  // 8. Home: Mary's box, her sealed envelope, and the bank on the shelf.
  await expect(page).toHaveURL(/\/home$/);
  await expect(page.getByRole("button", { name: /Open Mary's gifts/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "For Mary, on a hard day" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Barclays/ })).toBeVisible();

  // Their own voice note plays back, through a short-lived link.
  await page.getByRole("button", { name: /Open Mary's gifts/ }).click();
  await page.getByRole("button", { name: "Play For Mary, on a hard day" }).click();
  await expect(page.getByRole("button", { name: "Pause For Mary, on a hard day" })).toBeVisible();
});

test("the first question waits until it can be answered, and then keeps what is typed", async ({ page }) => {
  // Hold the page's scripts back, so for a while the screen is only its HTML: a slow phone, in effect.
  let wake!: () => void;
  const asleep = new Promise<void>((resolve) => (wake = resolve));
  await page.route(/\/_next\/static\/.*\.js/, async (route) => {
    await asleep;
    await route.continue();
  });
  await page.goto("/start/someone", { waitUntil: "commit" });

  // The question is there to read. Its fields can't be typed in yet, so nothing typed can be lost.
  await expect(page.getByRole("heading", { name: "Think of someone you love. Who came to mind first?" })).toBeVisible();
  const field = page.getByLabel("Their name");
  await expect(field).toBeDisabled();
  await expect(page.getByRole("radio", { name: "Daughter" })).toBeDisabled();

  // Awake: straight away, a name and a choice are kept.
  wake();
  await field.fill("Mary");
  await page.getByText("Daughter", { exact: true }).click();
  await expect(field).toHaveValue("Mary");
  await expect(page.locator(".gift-tag")).toHaveText("Mary");
  await page.getByRole("button", { name: "This is for Mary" }).click();
  await expect(page).toHaveURL(/\/start\/message$/);
  await expect(page.getByRole("heading", { name: "Say something to Mary. Something only you could say." })).toBeVisible();
});

test("a refresh in the middle of onboarding resumes on the same step, with nothing lost", async ({ page }) => {
  await begin(page);

  // Nobody yet, on the first question: a refresh stays there.
  await page.reload();
  await expect(page).toHaveURL(/\/start\/someone$/);

  await sealALetter(page);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page).toHaveURL(/\/start\/keep-safe$/);

  // On the sign-up step: a refresh stays there, and still knows who it is for.
  await page.reload();
  await expect(page).toHaveURL(/\/start\/keep-safe$/);
  await expect(page.getByRole("heading", { name: "Let's keep this safe for Mary." })).toBeVisible();

  // Coming back through the front door, or trying to jump ahead, lands on the saved step.
  await page.goto("/start");
  await expect(page).toHaveURL(/\/start\/keep-safe$/);
  await page.goto("/start/everyone");
  await expect(page).toHaveURL(/\/start\/keep-safe$/);
  await page.goto("/home");
  await expect(page).toHaveURL(/\/start\/keep-safe$/);

  // Going back is allowed, and what was made is still there.
  await page.goto("/start/message");
  await expect(page.getByRole("heading", { name: "Sealed for Mary." })).toBeVisible();
  await page.goto("/start/someone");
  await expect(page.getByLabel("Their name")).toHaveValue("Mary");

  // After signing up, the same holds for the later steps.
  await page.goto("/start/keep-safe");
  await signInWithCode(page, newEmail("resume"), "Keep it safe");
  await expect(page).toHaveURL(/\/start\/reach$/);
  await page.getByRole("button", { name: "Add later" }).click();
  await expect(page).toHaveURL(/\/start\/find$/);
  await page.reload();
  await expect(page).toHaveURL(/\/start\/find$/);
  await expect(page.getByRole("heading", { name: "Where does your main bank account live?" })).toBeVisible();
});
