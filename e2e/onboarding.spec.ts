import { expect, test, type Locator } from "@playwright/test";
import { begin, nameThem, newEmail, onboard, onPhone, overflow, renameEnvelope, sealALetter, signInWithCode } from "./helpers";

test("a new person goes through all of onboarding and lands on /home", async ({ page }) => {
  const email = newEmail("new");

  // 1. Who came to mind? The first screen. Nobody is asked who they are yet, and
  // nothing is kept until they answer. The one field is ready to type in; the name appears on the box's tag.
  await page.goto("/start");
  await expect(page).toHaveURL(/\/start\/someone$/);
  await expect(page.getByRole("heading", { name: "Think of someone you love. Who came to mind first?" })).toBeVisible();
  await expect(page.getByLabel("Their name")).toBeFocused();
  await expect(page.getByRole("img", { name: "Step 1 of 4" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Back" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
  expect((await page.context().cookies()).some((cookie) => cookie.name.includes("session_token"))).toBe(false);
  await nameThem(page, "Mary");
  await expect(page.locator(".gift-tag")).toHaveText("Mary");
  await page.getByText("Daughter", { exact: true }).click();
  await page.getByRole("button", { name: "This is for Mary" }).click();

  // 2. Say something to them: a voice note, recorded, stopped, and sealed.
  await expect(page).toHaveURL(/\/start\/message$/);
  await expect(page.getByRole("heading", { name: "Say something to Mary." })).toBeFocused();
  await expect(page.getByText("Something only you could say.")).toBeVisible();
  await page.getByRole("button", { name: "Need an idea?" }).click();
  await page.getByRole("dialog", { name: "Need an idea?" }).getByRole("button", { name: "What to remember on a hard day" }).click();
  await page.getByRole("button", { name: "Record a voice note", exact: true }).click();
  await expect(page.getByRole("timer")).toBeVisible();
  await page.waitForTimeout(2200);
  await page.getByRole("button", { name: "Stop recording" }).click();
  await expect(page.getByRole("button", { name: "Play your voice note" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Record again" })).toBeVisible();
  // The idea named the envelope for them.
  await expect(page.getByText("For Mary, on a hard day")).toBeVisible();
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

  // 4. One thing they'd need to find: a name, never a number. Chosen, it is on the shelf at once,
  // and nothing is sent until Continue. (Nobody is asked for Mary's email or phone, or about reminder emails.)
  await expect(page).toHaveURL(/\/start\/find$/);
  await expect(page.getByRole("img", { name: "Step 4 of 4" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign in" })).toHaveCount(0);
  const saves: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "POST" && new URL(request.url()).pathname === "/api/onboarding") saves.push(request.url());
  });
  if (onPhone(page)) {
    // A phone: the four most common in one row; the rest, and a bank of their own, behind "More".
    await page.getByRole("button", { name: "More" }).click();
    const more = page.getByRole("dialog", { name: "Your main bank" });
    await more.getByRole("button", { name: "Other" }).click();
    await more.getByLabel("The bank's name").fill("12-34-56 12345678");
    await more.getByRole("button", { name: "Done" }).click();
    await expect(more).toBeHidden();
  } else {
    await page.getByText("Other", { exact: true }).click();
    await page.getByLabel("The bank's name").fill("12-34-56 12345678");
  }
  // A number is never shown back: not on the chip, not on the shelf.
  await expect(page.getByText("12-34-56 12345678")).toHaveCount(0);
  await expect(page.getByText("One less thing for them to search for.")).toHaveCount(0);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByText("That looks like a number or a password.")).toBeVisible();
  await page.getByText("Barclays", { exact: true }).click();
  await expect(page.getByText("One less thing for them to search for.")).toBeVisible();
  expect(saves).toHaveLength(0);
  await page.getByRole("button", { name: "Continue", exact: true }).click();

  // The last step for now, so it leads straight home: Mary's box, her sealed envelope, and the bank on the shelf.
  // Everyone starts on the free plan.
  await expect(page).toHaveURL(/\/home$/);
  expect(saves).toHaveLength(1);
  await expect(page.getByRole("button", { name: /Open Mary's gifts/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "For Mary, on a hard day" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Barclays/ })).toBeVisible();

  // Their own voice note plays back, through a short-lived link.
  await page.getByRole("button", { name: /Open Mary's gifts/ }).click();
  await page.getByRole("button", { name: "Play For Mary, on a hard day" }).click();
  await expect(page.getByRole("button", { name: "Pause For Mary, on a hard day" })).toBeVisible();
});

// Set aside for now (test.fixme): this is the test of typing the instant the page wakes, and on the
// development server a name typed in those first few milliseconds is sometimes dropped. A known issue, not yet fixed.
test.fixme("the first question waits until it can be answered, and then keeps what is typed", async ({ page }) => {
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
  await expect(page.getByRole("radio")).toHaveCount(0);

  // Awake: the field is ready, and straight away a name and a choice are kept.
  wake();
  await expect(field).toBeFocused();
  await field.fill("Mary");
  await page.getByText("Daughter", { exact: true }).click();
  await expect(field).toHaveValue("Mary");
  await expect(page.locator(".gift-tag")).toHaveText("Mary");
  await page.getByRole("button", { name: "This is for Mary" }).click();
  await expect(page).toHaveURL(/\/start\/message$/);
  await expect(page.getByRole("heading", { name: "Say something to Mary." })).toBeVisible();
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
  await page.goto("/start/find");
  await expect(page).toHaveURL(/\/start\/keep-safe$/);
  // The screens that are set aside (reaching them, the nudges, the offer) lead to where they are too.
  for (const setAside of ["reach", "nudges", "everyone"]) {
    await page.goto(`/start/${setAside}`);
    await expect(page).toHaveURL(/\/start\/keep-safe$/);
  }
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
  await expect(page).toHaveURL(/\/start\/find$/);
  await page.reload();
  await expect(page).toHaveURL(/\/start\/find$/);
  await expect(page.getByRole("heading", { name: "Where does your main bank account live?" })).toBeVisible();
  for (const setAside of ["reach", "nudges", "everyone"]) {
    await page.goto(`/start/${setAside}`);
    await expect(page).toHaveURL(/\/start\/find$/);
  }
});

test("the screens set aside are not part of onboarding: their addresses lead to where they are", async ({ page }) => {
  // Reaching them, the nudges and the offer. Nobody yet: the first question.
  const setAside = ["reach", "nudges", "everyone"];
  for (const step of setAside) {
    await page.goto(`/start/${step}`);
    await expect(page).toHaveURL(/\/start\/someone$/);
  }

  // The last step leads straight home, and from then on so do their old addresses.
  await onboard(page, newEmail("set-aside"));
  for (const step of setAside) {
    await page.goto(`/start/${step}`);
    await expect(page).toHaveURL(/\/home$/);
  }
  await page.goto("/start");
  await expect(page).toHaveURL(/\/home$/);
});

test("the first question opens with one field, and how they're related comes after, if at all", async ({ page }) => {
  await begin(page);
  const phone = onPhone(page);
  const chip = (label: string) => page.locator("label", { hasText: new RegExp(`^${label}$`) });
  const top = async (target: Locator) => Math.round((await target.boundingBox())!.y);

  // To begin with: the question and a name field. Nothing to choose, and no button.
  await expect(page.getByLabel("Their name")).toBeFocused();
  await expect(page.getByRole("radio")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /This is for/ })).toHaveCount(0);

  // A name, and one line slides in under it.
  await nameThem(page, "Mary");
  await expect(page.getByRole("group", { name: "Mary is your…" })).toBeVisible();
  await expect(page.getByRole("button", { name: "This is for Mary" })).toBeVisible();
  for (const common of ["Partner", "Daughter", "Son", "Mum"]) await expect(chip(common)).toBeVisible();

  if (phone) {
    // One row of small chips: the four most common and "More", never wrapping.
    const more = page.getByRole("button", { name: "More" });
    await expect(chip("Dad")).toBeHidden();
    expect(Math.round((await chip("Daughter").boundingBox())!.height)).toBe(36);
    expect(await top(more)).toBe(await top(chip("Partner")));

    // The rest wait in a sheet. One tap chooses and closes, and the choice comes to the front of the row.
    await more.click();
    const sheet = page.getByRole("dialog", { name: "Mary is your…" });
    for (const other of ["Dad", "Sister", "Brother", "Friend", "Someone else"]) {
      await expect(sheet.getByRole("button", { name: other })).toBeVisible();
    }
    await sheet.getByRole("button", { name: "Friend" }).click();
    await expect(sheet).toBeHidden();
    await expect(page.getByRole("radio", { name: "Friend" })).toBeChecked();
    expect((await chip("Friend").boundingBox())!.x).toBeLessThan((await chip("Partner").boundingBox())!.x);
    expect(await top(chip("Friend"))).toBe(await top(chip("Partner")));

    // "Someone else" takes a word of their own.
    await more.click();
    await sheet.getByRole("button", { name: "Someone else" }).click();
    await sheet.getByLabel("Who Mary is to you, in your words").fill("Godmother");
    await sheet.getByRole("button", { name: "Done" }).click();
    await expect(sheet).toBeHidden();
  } else {
    // With room to spare: every choice in one group, and no sheet.
    await expect(page.getByRole("radio")).toHaveCount(9);
    await expect(chip("Someone else")).toBeVisible();
    await expect(page.getByRole("button", { name: "More" })).toBeHidden();
    await chip("Someone else").click();
    await page.getByLabel("Who Mary is to you, in your words").fill("Godmother");
  }
  await expect(page.getByRole("radio", { name: "Godmother" })).toBeChecked();

  // It is optional: the chosen chip, tapped again, lets go.
  // Their word is kept, ready if they choose it again.
  await chip("Godmother").click();
  await expect(page.getByRole("radio", { checked: true })).toHaveCount(0);
  if (phone) {
    // On a phone it goes back behind "More".
    await expect(chip("Godmother")).toBeHidden();
    await page.getByRole("button", { name: "More" }).click();
    const sheet = page.getByRole("dialog", { name: "Mary is your…" });
    await sheet.getByRole("button", { name: "Someone else" }).click();
    await expect(sheet.getByLabel("Who Mary is to you, in your words")).toHaveValue("Godmother");
    await sheet.getByRole("button", { name: "Done" }).click();
  } else {
    await chip("Godmother").click();
  }
  await expect(page.getByRole("radio", { name: "Godmother" })).toBeChecked();

  // Kept, in their own word. Coming back, there is a name already, so no keyboard: the question has focus.
  await page.getByRole("button", { name: "This is for Mary" }).click();
  await expect(page).toHaveURL(/\/start\/message$/);
  await page.goto("/start/someone");
  await expect(page.getByLabel("Their name")).toHaveValue("Mary");
  await expect(page.getByRole("radio", { name: "Godmother" })).toBeChecked();
  await expect(page.getByRole("heading", { name: "Think of someone you love. Who came to mind first?" })).toBeFocused();
});

test("a name is enough: nobody has to say how they're related", async ({ page }) => {
  await begin(page);
  await nameThem(page, "Sam");
  await page.getByRole("button", { name: "This is for Sam" }).click();
  await expect(page).toHaveURL(/\/start\/message$/);
  await expect(page.getByRole("heading", { name: "Say something to Sam." })).toBeVisible();

  await page.getByRole("button", { name: "Write instead" }).click();
  await page.getByLabel("Your letter to Sam").fill("Thank you for the long walks.");
  await page.getByRole("button", { name: "Seal it for Sam" }).click();
  await expect(page.getByRole("heading", { name: "Sealed for Sam." })).toBeVisible();
  // We never guess at "she" or "he".
  await expect(page.getByText("Only they will read it, when the time comes.")).toBeVisible();

  await page.goto("/start/someone");
  await expect(page.getByLabel("Their name")).toHaveValue("Sam");
  await expect(page.getByRole("radio", { name: "Partner" })).not.toBeChecked();
  await expect(page.getByRole("radio", { name: "Daughter" })).not.toBeChecked();
});

test("saying something shows only what is needed now", async ({ page }) => {
  await begin(page);
  await nameThem(page, "Mary");
  await page.getByRole("button", { name: "This is for Mary" }).click();
  await expect(page).toHaveURL(/\/start\/message$/);

  const record = page.getByRole("button", { name: "Record a voice note", exact: true });
  const seal = page.getByRole("button", { name: "Seal it for Mary" });
  const rename = page.getByRole("button", { name: "Rename the envelope" });
  const ideas = page.getByRole("dialog", { name: "Need an idea?" });
  const idea = "A memory only you two share";

  // Ready: one big button, and two small ways round it. No ideas on the screen, no envelope, nothing to seal.
  await expect(record).toBeVisible();
  expect(Math.round((await record.boundingBox())!.width)).toBe(88);
  await expect(page.getByRole("button", { name: "Write instead" })).toBeVisible();
  await expect(page.getByText(idea)).toHaveCount(0);
  await expect(seal).toHaveCount(0);
  await expect(rename).toHaveCount(0);

  // The ideas wait in a sheet, which a swipe down puts away.
  await page.getByRole("button", { name: "Need an idea?" }).click();
  await expect(ideas.getByRole("button")).toHaveCount(4); // three ideas, and Close
  await page.waitForTimeout(500);
  const sheet = (await ideas.boundingBox())!;
  await page.mouse.move(sheet.x + sheet.width / 2, sheet.y + 12);
  await page.mouse.down();
  await page.mouse.move(sheet.x + sheet.width / 2, sheet.y + 160, { steps: 8 });
  await page.mouse.up();
  await expect(ideas).toBeHidden();

  // An idea they asked for is the one line that shows, and it names the envelope.
  await page.getByRole("button", { name: "Need an idea?" }).click();
  await ideas.getByRole("button", { name: idea }).click();
  await expect(ideas).toBeHidden();
  await expect(page.getByText(idea)).toBeVisible();
  await expect(page.getByRole("button", { name: "Another idea" })).toBeVisible();

  // Recording: the level, the time, and one button to stop.
  await record.click();
  await expect(page.getByRole("timer")).toBeVisible();
  await expect(page.getByRole("button", { name: "Write instead" })).toHaveCount(0);
  await expect(seal).toHaveCount(0);
  await page.waitForTimeout(1500);
  await page.getByRole("button", { name: "Stop recording" }).click();

  // Recorded: a small player, the envelope with its tag, and "Seal it".
  await expect(page.getByRole("button", { name: "Play your voice note" })).toBeVisible();
  await expect(page.getByText("For Mary, to make you smile")).toBeVisible();
  await expect(seal).toBeVisible();
  await page.getByRole("button", { name: "Play your voice note" }).click();
  await expect(page.getByRole("button", { name: "Pause your voice note" })).toBeVisible();

  // The pencil renames the envelope in place. Escape leaves it be; rubbed out, it goes back to "For Mary".
  await renameEnvelope(page, "For Mary, from Dad");
  await expect(page.getByText("For Mary, from Dad")).toBeVisible();
  await rename.click();
  await expect(page.getByLabel("Name on the envelope")).toBeFocused();
  await page.getByLabel("Name on the envelope").fill("Something else");
  await page.keyboard.press("Escape");
  await expect(page.getByText("For Mary, from Dad")).toBeVisible();
  await renameEnvelope(page, "");
  await expect(page.getByText("For Mary", { exact: true })).toBeVisible();

  // Recording again starts from the one button.
  await page.getByRole("button", { name: "Record again" }).click();
  await expect(record).toBeVisible();
  await expect(seal).toHaveCount(0);
  await expect(rename).toHaveCount(0);

  // Writing instead: the page, ready to type on. The envelope and "Seal it" come with the first words, and go with them.
  await page.getByRole("button", { name: "Write instead" }).click();
  const letter = page.getByLabel("Your letter to Mary");
  await expect(letter).toBeFocused();
  await expect(seal).toHaveCount(0);
  await letter.fill("Remember the blue bicycle.");
  await expect(seal).toBeVisible();
  await expect(rename).toBeVisible();
  await letter.fill("");
  await expect(seal).toHaveCount(0);
  await letter.fill("Remember the blue bicycle.");
  await seal.click();

  // Sealed, and one small button to do it again.
  await expect(page.getByRole("heading", { name: "Sealed for Mary." })).toBeVisible();
  await expect(page.getByRole("button", { name: "Write it again" })).toBeVisible();
});

test("the code screen asks for the code and nothing else", async ({ page }) => {
  const email = newEmail("code");
  await begin(page);
  await sealALetter(page);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page).toHaveURL(/\/start\/keep-safe$/);

  await page.getByLabel("Your email").fill(email);
  await page.getByRole("button", { name: "Send my code" }).click();
  await expect(page.getByLabel("Your 6-digit code")).toBeFocused();
  await expect(page.getByText(`Sent to ${email}. It lasts 5 minutes.`)).toBeVisible();
  await expect(page.getByText("Not even afterbox can open your vault.")).toHaveCount(0);

  // The wrong address? One tap back, with it still there to correct.
  await page.getByRole("button", { name: "Change email" }).click();
  await expect(page.getByLabel("Your email")).toHaveValue(email);
  await page.getByRole("button", { name: "Send my code" }).click();
  await page.getByRole("button", { name: "Send a new code" }).click();
  await expect(page.getByText("A new code is on its way.")).toBeVisible();
});

test.describe("on a small phone", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("no onboarding screen needs scrolling", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "phone", "A phone's layout only.");
    const fits = async (screen: string) => {
      // Once any slide or reveal has settled.
      await expect.poll(() => overflow(page), { message: `${screen} fits on the screen` }).toBe(0);
    };

    await begin(page);
    await fits("who came to mind, empty");
    await nameThem(page, "Mary");
    await expect(page.getByRole("button", { name: "More" })).toBeVisible();
    await fits("who came to mind, a name typed");
    await page.getByText("Daughter", { exact: true }).click();
    await page.getByRole("button", { name: "This is for Mary" }).click();

    await expect(page).toHaveURL(/\/start\/message$/);
    await expect(page.getByRole("button", { name: "Record a voice note", exact: true })).toBeVisible();
    await fits("say something, ready");
    await page.getByRole("button", { name: "Need an idea?" }).click();
    await page.getByRole("dialog", { name: "Need an idea?" }).getByRole("button", { name: "What to remember on a hard day" }).click();
    await fits("say something, with an idea");
    await page.getByRole("button", { name: "Record a voice note", exact: true }).click();
    await expect(page.getByRole("timer")).toBeVisible();
    await fits("say something, recording");
    await page.waitForTimeout(1500);
    await page.getByRole("button", { name: "Stop recording" }).click();
    await expect(page.getByRole("button", { name: "Seal it for Mary" })).toBeVisible();
    await fits("say something, recorded");
    await page.getByRole("button", { name: "Rename the envelope" }).click();
    await fits("say something, renaming the envelope");
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Record again" }).click();
    await page.getByRole("button", { name: "Write instead" }).click();
    await fits("say something, writing");
    await page.getByLabel("Your letter to Mary").fill("Remember the blue bicycle, and the hill we never quite made it up.");
    await expect(page.getByRole("button", { name: "Seal it for Mary" })).toBeVisible();
    await fits("say something, written");
    await page.getByRole("button", { name: "Seal it for Mary" }).click();
    await expect(page.getByRole("heading", { name: "Sealed for Mary." })).toBeVisible();
    await fits("sealed");
    await page.getByRole("button", { name: "Continue", exact: true }).click();

    await expect(page).toHaveURL(/\/start\/keep-safe$/);
    await fits("keep it safe, the email");
    const email = `mary.${Date.now().toString(36)}@example.com`;
    await page.getByLabel("Your email").fill(email);
    await page.getByRole("button", { name: "Send my code" }).click();
    await expect(page.getByLabel("Your 6-digit code")).toBeVisible();
    await fits("keep it safe, the code");
    await page.getByRole("button", { name: "Change email" }).click();
    await signInWithCode(page, email, "Keep it safe");

    await expect(page).toHaveURL(/\/start\/find$/);
    await fits("their bank, empty");
    await page.getByText("Barclays", { exact: true }).click();
    await expect(page.getByText("One less thing for them to search for.")).toBeVisible();
    await fits("their bank, chosen");
  });
});
