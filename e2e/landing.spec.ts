import { expect, test } from "@playwright/test";

test("the landing page hands over to onboarding without a page load, and the box travels", async ({ page }) => {
  // Count the view transitions the browser is asked for, and note which named parts take part.
  await page.addInitScript(() => {
    const w = window as unknown as { __transitions: string[][] };
    w.__transitions = [];
    const start = document.startViewTransition?.bind(document);
    if (!start) return;
    document.startViewTransition = ((...args: Parameters<typeof start>) => {
      const transition = start(...args);
      void transition.ready
        .then(() => {
          const names = document
            .getAnimations()
            .map((animation) => (animation.effect as KeyframeEffect | null)?.pseudoElement ?? "")
            .filter((name) => name.startsWith("::view-transition"));
          w.__transitions.push([...new Set(names)]);
        })
        .catch(() => w.__transitions.push([]));
      return transition;
    }) as typeof document.startViewTransition;
  });

  await page.goto("/");
  await page.evaluate(() => ((window as unknown as { __stayed: boolean }).__stayed = true));

  // To the end of the hero's zoom, where the box and the button are.
  await page.evaluate(() => {
    const hero = document.getElementById("hero")!;
    window.scrollTo(0, hero.offsetTop + hero.offsetHeight - window.innerHeight);
  });
  const button = page.locator("#hero").getByRole("link", { name: "Build their gift" });
  await expect(button).toBeVisible();
  await page.waitForTimeout(500);
  await button.click();

  // Straight to the first question: the landing page has already said what this is.
  await expect(page).toHaveURL(/\/start\/someone$/);
  // Its one field is ready to type in.
  await expect(page.getByRole("heading", { name: "Think of someone you love. Who came to mind first?" })).toBeVisible();
  await expect(page.getByLabel("Their name")).toBeFocused();
  await expect(page.getByText("This is for the people you love most.")).toHaveCount(0);

  // The same document throughout: a transition, not a page load.
  expect(await page.evaluate(() => (window as unknown as { __stayed?: boolean }).__stayed)).toBe(true);

  // A view transition ran, and the gift box was one of the things that moved in it.
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { __transitions: string[][] }).__transitions.flat()))
    .toContain("::view-transition-group(gift-box)");

  // The wordmark is where it was, and the box is in the middle of the first screen.
  await expect(page.getByRole("link", { name: "afterbox, home" })).toBeVisible();
  const box = await page.locator(".gift-box svg").last().boundingBox();
  const { width } = page.viewportSize()!;
  expect(Math.abs(box!.x + box!.width / 2 - width / 2)).toBeLessThan(4);
});

test("with reduced motion, the change is instant and nothing is animated", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/");
  const button = page.getByRole("link", { name: "Build their gift" }).first();
  await button.click();
  await expect(page).toHaveURL(/\/start\/someone$/);
  await expect(page.getByRole("heading", { name: "Think of someone you love. Who came to mind first?" })).toBeVisible();
  // Whatever view transition the browser ran has no length.
  const longest = await page.evaluate(() =>
    Math.max(
      0,
      ...document
        .getAnimations()
        .filter((animation) => ((animation.effect as KeyframeEffect | null)?.pseudoElement ?? "").startsWith("::view-transition"))
        .map((animation) => Number(animation.effect?.getComputedTiming().duration ?? 0)),
    ),
  );
  expect(longest).toBe(0);
  await context.close();
});
