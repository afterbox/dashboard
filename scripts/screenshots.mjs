// Screenshots of every onboarding step, in every state, and /home: at four sizes, light and dark.
//
//   1. Start the app in end-to-end test mode (an in-process database, no real email):
//        E2E_TEST_MODE=1 BETTER_AUTH_URL=http://localhost:3100 npx next dev -p 3100
//   2. node scripts/screenshots.mjs                  (all sizes, both themes)
//      node scripts/screenshots.mjs 390 light        (one size, one theme)
//      node scripts/screenshots.mjs 375 light start  (stop after steps 1 and 2)
//
// Pictures land in test-results/screenshots/<size>-<theme>/. Each is of the
// screen as it is first seen, not the whole page, and the script says which
// screens would need scrolling: on a phone no onboarding screen should, apart
// from its sheets. Test mode only: the sign-in code is read from
// /api/test/otp, which does not exist otherwise.
import { mkdir } from "node:fs/promises";
import { chromium } from "@playwright/test";

const base = process.env.BASE_URL ?? "http://localhost:3100";
const sizes = [
  { name: "320", width: 320, height: 568 },
  { name: "375", width: 375, height: 667 },
  { name: "390", width: 390, height: 844 },
  { name: "1440", width: 1440, height: 900 },
];
const themes = ["light", "dark"];
const [onlySize, onlyTheme, upTo] = process.argv.slice(2);

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
    const phone = size.width < 700;
    const scrolls = [];
    let n = 0;
    const shot = async (name, options = {}) => {
      // Let rewards and slides finish, so the picture is of the screen at rest.
      await page.waitForTimeout(options.wait ?? 700);
      n += 1;
      // Next's own development badge is not part of the design; leave it out of the picture.
      const over = await page.evaluate(() => {
        document.querySelectorAll("nextjs-portal").forEach((badge) => (badge.style.display = "none"));
        return document.documentElement.scrollHeight - window.innerHeight;
      });
      if (over > 0) scrolls.push(`${name} (${over}px)`);
      await page.screenshot({ path: `${dir}/${String(n).padStart(2, "0")}-${name}.png`, fullPage: options.fullPage ?? false });
    };
    // About as long as a real address, so the screens are measured as people will see them.
    const email = `mary.${Date.now().toString(36)}@example.com`;
    const record = async (name) => {
      await page.getByRole("button", { name: "Record a voice note", exact: true }).click();
      await page.getByRole("timer").waitFor();
      if (name) await shot(name, { wait: 2200 });
      else await page.waitForTimeout(1500);
      await page.getByRole("button", { name: "Stop recording" }).click();
      await page.getByRole("button", { name: "Play your voice note" }).waitFor();
    };

    try {
      // 1. Who came to mind? Empty, a name typed, the "More" sheet (a phone only), someone chosen.
      await page.goto(`${base}/start`);
      await page.waitForURL("**/start/someone");
      await page.getByLabel("Their name").waitFor();
      await shot("someone-empty");
      // Typed, and checked: on the development server a name typed the instant the page wakes can be dropped.
      for (let tries = 0; tries < 5; tries++) {
        await page.getByLabel("Their name").fill("Mary");
        const heard = await page.getByRole("button", { name: "This is for Mary" }).waitFor({ timeout: 1500 }).then(() => true, () => false);
        if (heard) break;
      }
      await shot("someone-typed");
      if (phone) {
        await page.getByRole("button", { name: "More" }).click();
        await shot("someone-more-sheet", { wait: 900 });
        await page.getByRole("button", { name: "Someone else" }).click();
        await shot("someone-more-sheet-else", { wait: 900 });
        await page.keyboard.press("Escape");
      }
      await page.getByText("Daughter", { exact: true }).click();
      await shot("someone-chosen");
      await page.getByRole("button", { name: "This is for Mary" }).click();

      // 2. Say something: ready, the ideas sheet, recording, recorded, renaming the envelope, writing.
      await page.waitForURL("**/start/message");
      await page.getByRole("button", { name: "Record a voice note", exact: true }).waitFor();
      await shot("message-ready");
      await page.getByRole("button", { name: "Need an idea?" }).click();
      await shot("message-ideas-sheet", { wait: 900 });
      await page.getByRole("button", { name: "What to remember on a hard day" }).click();
      await shot("message-ready-idea", { wait: 900 });
      await record("message-recording");
      await shot("message-recorded");
      await page.getByRole("button", { name: "Rename the envelope" }).click();
      await shot("message-renaming");
      await page.keyboard.press("Escape");
      await page.getByRole("button", { name: "Record again" }).click();
      await page.getByRole("button", { name: "Write instead" }).click();
      await shot("message-writing-empty");
      await page.getByLabel("Your letter to Mary").fill("Remember the blue bicycle, and the hill we never quite made it up. You kept going. You always do.");
      await shot("message-writing");
      await page.getByRole("button", { name: "Record instead" }).click();
      await record();
      await page.getByRole("button", { name: "Seal it for Mary" }).click();
      await page.getByRole("heading", { name: "Sealed for Mary." }).waitFor();
      await shot("message-sealing", { wait: 450 });
      await shot("message-sealed", { wait: 2200 });
      if (upTo === "start") throw "done";
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

      await page.waitForURL("**/start/find");
      await shot("find-empty");
      await page.getByText("Barclays", { exact: true }).click();
      await page.getByText("One less thing for them to search for.").waitFor();
      await shot("find-chosen", { wait: 1200 });
      await shot("find-chosen-full", { fullPage: true, wait: 0 });
      // The last step for now: it leads home.
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
      await shot("home-compose", { wait: 900 });
      await page.getByRole("button", { name: "Write instead" }).click();
      await page.getByLabel("Your letter to Mary").fill("Remember the blue bicycle, and the hill we never quite made it up.");
      await page.getByRole("button", { name: "Rename the envelope" }).click();
      await page.getByLabel("Name on the envelope").fill("For Mary, about the bicycle");
      await page.keyboard.press("Enter");
      await shot("home-compose-letter", { wait: 900 });
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
      await page.getByText("Sealed for Mary.").first().waitFor();
      await shot("home-sealed", { wait: 900 });
      await page.unroute(giftsApi, holdBack);
      console.log(`${size.name} ${theme}: done`);
    } catch (problem) {
      if (problem === "done") {
        console.log(`${size.name} ${theme}: done (steps 1 and 2)`);
      } else {
        await shot("stopped-here", { wait: 0 }).catch(() => {});
        console.log(`${size.name} ${theme}: stopped at ${page.url()}\n  ${String(problem).split("\n")[0]}`);
        process.exitCode = 1;
      }
    }
    if (scrolls.length) console.log(`  would need scrolling: ${scrolls.join(", ")}`);
    await context.close();
  }
}

await browser.close();
