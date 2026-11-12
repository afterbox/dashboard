// Scratch: every word on the page, section by section, for the copy audit. Not part of the site.
import { chromium } from "playwright-core";
import { homedir } from "node:os";
const browser = await chromium.launch({
  executablePath: `${homedir()}/Library/Caches/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-mac-arm64/chrome-headless-shell`,
});
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
const page = await context.newPage();
for (const path of ["/", "/family-support", "/privacy", "/terms", "/start"]) {
  await page.goto(`http://localhost:3211${path}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const text = await page.evaluate(() => {
    const out = [];
    const blocks = document.querySelectorAll("header, main > section, main > div > section, main > *:not(section):not(div), footer, main:not(:has(section))");
    for (const el of blocks) {
      const name = el.getAttribute("data-section") ?? el.id ?? el.tagName.toLowerCase();
      // textContent, so words that are visually hidden or waiting to fade in are audited too.
      const words = [];
      const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      while (walk.nextNode()) {
        const t = walk.currentNode.textContent.replace(/\s+/g, " ").trim();
        if (t) words.push(t);
      }
      const labels = [...el.querySelectorAll("[aria-label]")].map((n) => `[aria-label] ${n.getAttribute("aria-label")}`);
      out.push(`\n## ${name || el.tagName.toLowerCase()}\n${words.join(" | ")}\n${[...new Set(labels)].join("\n")}`);
    }
    return out.join("\n");
  });
  console.log(`\n# ${path}\n${text}`);
}
await browser.close();
