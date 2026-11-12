// Scratch: does "Back" go to the right place? Not part of the site.
import { chromium } from "playwright-core";
import { homedir } from "node:os";
const browser = await chromium.launch({ executablePath: `${homedir()}/Library/Caches/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-mac-arm64/chrome-headless-shell` });
const page = await (await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })).newPage();
const back = 'main a:has-text("Back")';
// 1. Arrived directly.
for (const path of ["/terms", "/privacy", "/family-support", "/start"]) {
  await page.goto(`http://localhost:3210${path}`, { waitUntil: "networkidle" });
  await page.click(back);
  await page.waitForURL("http://localhost:3210/", { timeout: 8000 });
  console.log("direct", path, "->", new URL(page.url()).pathname);
}
// 2. From the footer of the home page.
await page.goto("http://localhost:3210/", { waitUntil: "networkidle" });
await page.evaluate(() => document.querySelector("footer").scrollIntoView({ behavior: "instant" }));
await page.waitForTimeout(800);
const before = await page.evaluate(() => Math.round(scrollY));
await page.click('footer a[href="/privacy"]');
await page.waitForURL(/privacy/);
await page.waitForTimeout(800);
await page.click(back);
await page.waitForURL("http://localhost:3210/");
await page.waitForTimeout(1500);
console.log("from footer: scrollY before", before, "after back", await page.evaluate(() => Math.round(scrollY)));
await browser.close();
