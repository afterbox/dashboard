// Scratch tool for checking the page in a real browser. Not part of the site.
//
//   node .shots/shoot.mjs --w 390 --h 844 --scheme dark --out s5-m "sel@offset@wait" ...
//
// Each positional argument is one frame: scroll (in small steps, like a hand)
// until `sel`'s top edge is `offset` px below the top of the screen, wait
// `wait` ms, take a picture. "+N@wait" scrolls on by N px instead.
// "click:sel@wait" and "key:Name@wait" act instead of scrolling.
// The frames are also laid side by side on one sheet: <out>-sheet.png.
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";
import { homedir } from "node:os";

const args = process.argv.slice(2);
const opt = { w: 1440, h: 900, scheme: "light", out: "shot", url: "http://localhost:3210/", dpr: 1, cols: 0 };
const frames = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--reduced") opt.reduced = true;
  else if (a === "--touch") opt.touch = true;
  else if (a === "--nosheet") opt.nosheet = true;
  else if (a.startsWith("--")) opt[a.slice(2)] = args[++i];
  else frames.push(a);
}
const w = Number(opt.w);
const h = Number(opt.h);
mkdirSync(".shots/out", { recursive: true });

const browser = await chromium.launch({
  executablePath: `${homedir()}/Library/Caches/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-mac-arm64/chrome-headless-shell`,
});
const context = await browser.newContext({
  viewport: { width: w, height: h },
  deviceScaleFactor: Number(opt.dpr),
  colorScheme: opt.scheme,
  reducedMotion: opt.reduced ? "reduce" : "no-preference",
  hasTouch: Boolean(opt.touch),
  isMobile: Boolean(opt.touch),
});
const page = await context.newPage();
const problems = [];
page.on("console", (m) => {
  if (m.type() === "error" || m.type() === "warning") problems.push(`${m.type()}: ${m.text()}`);
});
page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
await page.goto(opt.url, { waitUntil: "networkidle" });
await page.waitForTimeout(600);

const scrollTo = async (target) => {
  const from = await page.evaluate(() => scrollY);
  const dist = target - from;
  const steps = Math.max(1, Math.min(140, Math.round(Math.abs(dist) / 70)));
  for (let s = 1; s <= steps; s++) {
    await page.evaluate((y) => scrollTo({ top: y, behavior: "instant" }), from + (dist * s) / steps);
    await page.waitForTimeout(16);
  }
};

const files = [];
let n = 0;
for (const frame of frames) {
  n++;
  if (frame.startsWith("click:")) {
    const [sel, wait = "600"] = frame.slice(6).split("@");
    await page.click(sel);
    await page.waitForTimeout(Number(wait));
  } else if (frame.startsWith("key:")) {
    const [key, wait = "600"] = frame.slice(4).split("@");
    await page.keyboard.press(key);
    await page.waitForTimeout(Number(wait));
  } else if (frame.startsWith("+") || frame.startsWith("-")) {
    const [by, wait = "1200"] = frame.split("@");
    await scrollTo((await page.evaluate(() => scrollY)) + Number(by));
    await page.waitForTimeout(Number(wait));
  } else {
    const [sel, offset = "0", wait = "1500"] = frame.split("@");
    const top = await page.evaluate((s) => {
      const el = document.querySelector(s);
      return el ? el.getBoundingClientRect().top + scrollY : null;
    }, sel);
    if (top === null) {
      console.log(`missing: ${sel}`);
      continue;
    }
    await scrollTo(top - Number(offset));
    await page.waitForTimeout(Number(wait));
  }
  const file = `.shots/out/${opt.out}-${String(n).padStart(2, "0")}.png`;
  await page.screenshot({ path: file });
  files.push(file);
}

// --sweep N: walk the whole page from the top, a picture every N px.
if (opt.sweep) {
  const total = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  for (let y = 0; y < total + Number(opt.sweep); y += Number(opt.sweep)) {
    await scrollTo(Math.min(y, total));
    await page.waitForTimeout(Number(opt.wait ?? 900));
    const file = `.shots/out/${opt.out}-${String(++n).padStart(2, "0")}.png`;
    await page.screenshot({ path: file });
    files.push(file);
  }
}

if (opt.full) {
  await page.screenshot({ path: `.shots/out/${opt.out}-full.png`, fullPage: true });
}

const info = await page.evaluate(() => ({
  height: document.documentElement.scrollHeight,
  overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
}));
console.log(JSON.stringify({ ...info, problems: [...new Set(problems)].slice(0, 12) }));

// One sheet with every frame side by side, so they can be looked at together.
if (files.length > 0 && !opt.nosheet) {
  const cols = Number(opt.cols) || files.length;
  const cell = Math.min(w, Math.floor(2000 / cols));
  const sheet = await context.newPage();
  const rows = Math.ceil(files.length / cols);
  const cellH = Math.round((cell * h) / w);
  await sheet.setViewportSize({ width: cell * cols + 8 * (cols + 1), height: (cellH + 8) * rows + 8 });
  const { readFileSync } = await import("node:fs");
  const imgs = files
    .map((f) => `<img src="data:image/png;base64,${readFileSync(f).toString("base64")}" style="width:${cell}px;height:${cellH}px;display:block">`)
    .join("");
  await sheet.setContent(
    `<body style="margin:0;padding:8px;background:#777;display:grid;grid-template-columns:repeat(${cols},${cell}px);gap:8px">${imgs}</body>`,
  );
  await sheet.screenshot({ path: `.shots/out/${opt.out}-sheet.png` });
}
await browser.close();
