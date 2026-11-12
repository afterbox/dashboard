// Scratch tool: how fast the page wakes up on a mid-range phone, and how it scrolls.
// Not part of the site.
//
//   node .shots/perf.mjs [url]
import { chromium } from "playwright-core";
import { homedir } from "node:os";

const url = process.argv.slice(2).find((a) => a.startsWith("http")) ?? "http://localhost:3211/";
const browser = await chromium.launch({
  executablePath: `${homedir()}/Library/Caches/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-mac-arm64/chrome-headless-shell`,
});
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  hasTouch: true,
  isMobile: true,
});
const page = await context.newPage();
const cdp = await context.newCDPSession(page);
// --net slow4g (default: ~1.6 Mbps, 150 ms round trips) | fast4g (9 Mbps, 60 ms) | none.  --cpu N: N times slower (default 4).
const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : fallback;
};
const net = { slow4g: [150, 1.6], fast4g: [60, 9], none: [0, 0] }[arg("net", "slow4g")];
await cdp.send("Emulation.setCPUThrottlingRate", { rate: Number(arg("cpu", 4)) });
await cdp.send("Network.enable");
if (net[1]) {
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: net[0],
    downloadThroughput: (net[1] * 1024 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
  });
}

await page.addInitScript(() => {
  window.__m = { cls: 0, shifts: [], long: 0, longest: 0 };
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) {
      if (e.hadRecentInput) continue;
      window.__m.cls += e.value;
      window.__m.shifts.push({ at: Math.round(e.startTime), value: Number(e.value.toFixed(4)), y: Math.round(scrollY) });
    }
  }).observe({ type: "layout-shift", buffered: true });
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) {
      window.__m.long += Math.max(0, e.duration - 50);
      window.__m.longest = Math.max(window.__m.longest, e.duration);
    }
  }).observe({ type: "longtask", buffered: true });
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) window.__m.lcp = Math.round(e.startTime);
  }).observe({ type: "largest-contentful-paint", buffered: true });
  // Every scene is awake once React has taken hold of the last one's button.
  const pollAll = setInterval(() => {
    const el = document.querySelector('[data-section="final-scene"] a');
    if (el && Object.keys(el).some((k) => k.startsWith("__reactProps"))) {
      window.__m.allAwake = Math.round(performance.now());
      clearInterval(pollAll);
    }
  }, 25);
  // The hero is awake once React has taken hold of its button.
  const poll = setInterval(() => {
    const el = document.querySelector("#hero a, #hero button");
    if (el && Object.keys(el).some((k) => k.startsWith("__reactProps"))) {
      window.__m.heroAwake = Math.round(performance.now());
      clearInterval(poll);
    }
  }, 25);
});

await page.goto(url, { waitUntil: "load" });
await page.waitForFunction(() => window.__m.heroAwake, null, { timeout: 30000 });
await page.waitForTimeout(3000);
const load = await page.evaluate(() => ({
  fcp: Math.round(performance.getEntriesByName("first-contentful-paint")[0]?.startTime ?? -1),
  lcp: window.__m.lcp,
  heroAwake: window.__m.heroAwake,
  allAwake: window.__m.allAwake,
  blockedMs: Math.round(window.__m.long),
  longestTask: Math.round(window.__m.longest),
  cls: Number(window.__m.cls.toFixed(4)),
  js: performance
    .getEntriesByType("resource")
    .filter((r) => r.name.endsWith(".js"))
    .reduce((n, r) => n + r.transferSize, 0),
}));
console.log("load", JSON.stringify(load));
if (process.argv.includes("--resources")) {
  const res = await page.evaluate(() =>
    performance.getEntriesByType("resource").map((r) => [Math.round(r.startTime), Math.round(r.responseEnd), r.transferSize, r.name.split("/").pop().slice(0, 40)]),
  );
  for (const r of res) console.log(r.join("\t"));
  const nav = await page.evaluate(() => { const n = performance.getEntriesByType("navigation")[0]; return [Math.round(n.responseStart), Math.round(n.responseEnd), n.transferSize, Math.round(n.domContentLoadedEventEnd)]; });
  console.log("nav", nav.join("\t"));
}

if (process.argv.includes("--noscroll")) {
  await browser.close();
  process.exit(0);
}
// Scroll the whole page like a thumb would, and time every frame.
await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
const scroll = await page.evaluate(async () => {
  const before = window.__m.cls;
  const shiftsBefore = window.__m.shifts.length;
  const total = document.documentElement.scrollHeight - innerHeight;
  const gaps = [];
  let last = performance.now();
  let y = 0;
  await new Promise((done) => {
    const tick = (now) => {
      gaps.push(now - last);
      last = now;
      y += 14; // about 850 px a second at 60 frames
      scrollTo({ top: y, behavior: "instant" });
      if (y < total) requestAnimationFrame(tick);
      else done();
    };
    requestAnimationFrame(tick);
  });
  gaps.sort((a, b) => a - b);
  const at = (q) => Number(gaps[Math.floor(gaps.length * q)].toFixed(1));
  return {
    frames: gaps.length,
    median: at(0.5),
    p95: at(0.95),
    p99: at(0.99),
    worst: Number(gaps[gaps.length - 1].toFixed(1)),
    over50ms: gaps.filter((g) => g > 50).length,
    clsWhileScrolling: Number((window.__m.cls - before).toFixed(4)),
    shifts: window.__m.shifts.slice(shiftsBefore).filter((s) => s.value > 0.005),
  };
});
console.log("scroll", JSON.stringify(scroll));
await browser.close();
