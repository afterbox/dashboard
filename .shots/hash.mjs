// Scratch: where does a link to a place on the page land? Not part of the site.
import { chromium } from "playwright-core";
import { homedir } from "node:os";
const [url, w = "390", h = "844"] = process.argv.slice(2);
const browser = await chromium.launch({
  executablePath: `${homedir()}/Library/Caches/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-mac-arm64/chrome-headless-shell`,
});
const context = await browser.newContext({ viewport: { width: Number(w), height: Number(h) }, hasTouch: w === "390", isMobile: w === "390" });
const page = await context.newPage();
await page.addInitScript(() => {
  window.__log = [];
  const id = location.hash.slice(1);
  const note = (why) => {
    const el = document.getElementById(id);
    window.__log.push([Math.round(performance.now()), why, Math.round(scrollY), el ? Math.round(el.getBoundingClientRect().top) : null, document.documentElement.scrollHeight]);
  };
  document.addEventListener("DOMContentLoaded", () => note("dcl"));
  window.addEventListener("load", () => note("load"));
  window.addEventListener("scroll", () => note("scroll"));
  let last = 0;
  setInterval(() => { const hgt = document.documentElement.scrollHeight; if (hgt !== last) { last = hgt; note("height"); } }, 20);
  setTimeout(() => note("2s"), 2000); setTimeout(() => note("4s"), 4000);
});
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(4500);
for (const row of await page.evaluate(() => window.__log)) console.log(row.join("\t"));
await browser.close();
