// Screenshots of every onboarding step and /home, at three sizes, light and dark.
//
//   1. Start the app in end-to-end test mode (an in-process database, no real email):
//        E2E_TEST_MODE=1 BETTER_AUTH_URL=http://localhost:3100 npx next dev -p 3100
//   2. node scripts/screenshots.mjs            (all sizes)
//      node scripts/screenshots.mjs 390 light  (one size, one theme)
//
// Pictures land in test-results/screenshots/<size>-<theme>/. Test mode only:
// the sign-in code is read from /api/test/otp, which does not exist otherwise.
import { mkdir } from "node:fs/promises";
import { chromium } from "@playwright/test";

const base = process.env.BASE_URL ?? "http://localhost:3100";
const sizes = [
  { name: "320", width: 320, height: 568 },
  { name: "390", width: 390, height: 844 },
  { name: "1440", width: 1440, height: 900 },
];
const themes = ["light", "dark"];
const [onlySize, onlyTheme] = process.argv.slice(2);

const browser = await chromium.launch({
  args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"],
});

for (const size of sizes.filter((s) => !onlySize || s.name === onlySize)) {
  for (const theme of themes.filter((t) => !onlyTheme || t === onlyTheme)) {
    const dir = `test-results/screenshots/${size.name}-${theme}`;
    await mkdir(dir, { recursive: true });
    const context = await browser.newContext({
      viewport: { width: size.width, height: size.height },
      colorScheme: theme,
      deviceScaleFactor: 2,
      isMobile: size.width < 700,
      hasTouch: size.width < 700,
      permissions: ["microphone"],
    });
    const page = await context.newPage();
    let n = 0;
    const shot = async (name, options = {}) => {
      // Let rewards and slides finish, so the picture is of the screen at rest.
      await page.waitForTimeout(options.wait ?? 700);
      n += 1;
      // Next's own development badge is not part of the design; leave it out of the picture.
      await page.evaluate(() => document.querySelectorAll("nextjs-portal").forEach((badge) => (badge.style.display = "none")));
      await page.screenshot({ path: `${dir}/${String(n).padStart(2, "0")}-${name}.png`, fullPage: options.fullPage ?? false });
    };
    const email = `shots-${size.name}-${theme}-${Date.now()}@example.com`;

    try {
      await page.goto(`${base}/start`);
      await page.waitForURL("**/start/someone");
      await page.getByLabel("Their name").waitFor();
      await shot("someone-empty");
      await page.getByLabel("Their name").fill("Mary");
      await page.getByText("Daughter", { exact: true }).click();
      await shot("someone");
      await shot("someone-full", { fullPage: true, wait: 0 });
      await page.getByRole("button", { name: "This is for Mary" }).click();

      await page.waitForURL("**/start/message");
      await shot("message-empty", { fullPage: true });
      await page.getByRole("button", { name: "What to remember on a hard day" }).click();
      await page.getByRole("button", { name: "Record a voice note", exact: true }).click();
      await shot("message-recording", { wait: 2200 });
      await page.getByRole("button", { name: "Stop" }).click();
      await shot("message-recorded", { fullPage: true });
      await shot("message-recorded-screen", { wait: 0 });
      await page.getByRole("button", { name: "Seal it for Mary" }).click();
      await page.getByRole("heading", { name: "Sealed for Mary." }).waitFor();
      await shot("message-sealing", { wait: 450 });
      await shot("message-sealed", { wait: 2200 });
      await page.getByRole("button", { name: "Continue" }).click();

      await page.waitForURL("**/start/keep-safe");
      await shot("keep-safe-email");
      await page.getByLabel("Your email").fill(email);
      await page.getByRole("button", { name: "Send my code" }).click();
      await page.getByLabel("Your 6-digit code").waitFor();
      const { code } = await (await page.request.get(`${base}/api/test/otp?email=${encodeURIComponent(email)}`)).json();
      await page.getByLabel("Your 6-digit code").fill(code);
      await shot("keep-safe-code");
      await page.getByRole("button", { name: "Keep it safe" }).click();

      await page.waitForURL("**/start/reach");
      await shot("reach");
      await page.getByRole("button", { name: "Add later" }).click();

      await page.waitForURL("**/start/find");
      await shot("find-empty");
      await page.getByText("Barclays", { exact: true }).click();
      await page.getByRole("button", { name: "Add Barclays" }).click();
      await page.getByText("One less thing for them to search for.").waitFor();
      await shot("find-saved", { wait: 1200 });
      await shot("find-saved-full", { fullPage: true, wait: 0 });
      await page.getByRole("button", { name: "Continue" }).click();

      await page.waitForURL("**/start/nudges");
      await shot("nudges");
      await page.getByRole("button", { name: "Continue" }).click();

      await page.waitForURL("**/start/everyone");
      await shot("everyone", { fullPage: true });
      await shot("everyone-screen", { wait: 0 });
      await page.getByRole("button", { name: /Build gifts for everyone/ }).click();
      await page.getByText("Paid plans open soon.").waitFor();
      await shot("everyone-paid", { fullPage: true });
      await page.getByRole("button", { name: "Continue" }).click();

      await page.waitForURL("**/home");
      await page.getByRole("heading", { level: 1 }).waitFor();
      await shot("home", { wait: 1500 });
      await shot("home-full", { fullPage: true, wait: 0 });
      await page.getByRole("button", { name: /Mary/ }).first().click();
      await shot("home-person", { wait: 900 });
      await page.keyboard.press("Escape");
      await page.getByRole("button", { name: "Add someone you love" }).click();
      await shot("home-offer", { wait: 900 });
      await page.keyboard.press("Escape");
      await page.getByRole("button", { name: "Your account" }).click();
      await shot("home-settings", { wait: 900 });
      await page.keyboard.press("Escape");

      // A message that can't be sealed (the server is out of reach): it is kept, and says so.
      const giftsApi = (url) => url.pathname === "/api/gifts";
      const cutOff = (route) => (route.request().method() === "POST" ? route.abort() : route.continue());
      await page.route(giftsApi, cutOff);
      await page.getByRole("button", { name: /Open Mary's gifts/ }).click();
      await page.getByRole("button", { name: "Add another for Mary" }).click();
      await page.getByRole("button", { name: "Write it instead" }).click();
      await page.getByLabel("Your letter to Mary").fill("Remember the blue bicycle, and the hill we never quite made it up.");
      await page.getByLabel("Name the envelope").fill("For Mary, about the bicycle");
      await page.getByRole("button", { name: "Seal it for Mary" }).click();
      await page.getByText("This one isn't sealed yet.").waitFor();
      await shot("home-unsealed-sheet", { wait: 900 });
      await page.keyboard.press("Escape");
      await page.getByRole("button", { name: /isn't sealed yet/ }).scrollIntoViewIfNeeded();
      await shot("home-unsealed", { wait: 900 });

      // Trying again, with the server's answer held back: it is in the list already, marked as on its way.
      await page.unroute(giftsApi, cutOff);
      let letGo;
      const held = new Promise((done) => (letGo = done));
      const holdBack = async (route) => {
        if (route.request().method() === "POST") await held;
        await route.continue();
      };
      await page.route(giftsApi, holdBack);
      await page.getByRole("button", { name: /isn't sealed yet/ }).click();
      await page.getByRole("button", { name: "Seal it for Mary" }).click();
      await page.getByText("Sealing…").waitFor();
      await shot("home-sealing", { wait: 900 });
      letGo();
      await page.getByText("Sealed for Mary.").waitFor();
      await shot("home-sealed", { wait: 900 });
      await page.unroute(giftsApi, holdBack);
      console.log(`${size.name} ${theme}: done`);
    } catch (problem) {
      await shot("stopped-here", { wait: 0 }).catch(() => {});
      console.log(`${size.name} ${theme}: stopped at ${page.url()}\n  ${String(problem).split("\n")[0]}`);
      process.exitCode = 1;
    }
    await context.close();
  }
}

await browser.close();
