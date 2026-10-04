// Intro: frames over its whole timeline (desktop + phone), plus checks: a click
// skips it, a reload in the same tab skips it, script errors.
//   node tools/shoot-intro.mjs [http://localhost:4500/]   (default: the file)
import { chromium } from 'playwright-core';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const base = process.argv[2] || pathToFileURL(path.resolve('index.html')).href;
const at = [700, 1100, 1500, 1900, 2400, 3000, 3700, 4300, 5000];
fs.mkdirSync('lab/intro', { recursive: true });
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
// ONLY=desk or ONLY=phone runs one of the two.
for (const s of [
  { name: 'desk', viewport: { width: 1536, height: 864 }, deviceScaleFactor: 1 },
  { name: 'phone', viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true },
].filter(s => !process.env.ONLY || s.name === process.env.ONLY)) {
  const ctx = await browser.newContext(s);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const t0 = Date.now();
  await page.goto(base + '?intro', { waitUntil: 'commit' });
  for (const ms of at) {
    const wait = ms - (Date.now() - t0);
    if (wait > 0) await page.waitForTimeout(wait);
    await page.screenshot({ path: `lab/intro/${s.name}-${String(ms).padStart(4, '0')}.png` });
  }
  const after = await page.evaluate(() => ({ run: document.documentElement.classList.contains('intro-run'), overlay: !!document.querySelector('.pf-intro'), scrollable: getComputedStyle(document.documentElement).overflow }));
  // reload in the same tab: no intro
  await page.goto(base, { waitUntil: 'load' });
  const second = await page.evaluate(() => document.documentElement.classList.contains('intro-run'));
  // click skips
  const p2 = await ctx.newPage();
  await p2.goto(base + '?intro', { waitUntil: 'load' });
  await p2.waitForTimeout(900);
  await p2.mouse.click(200, 200);
  await p2.waitForTimeout(2000);
  const skipped = await p2.evaluate(() => !document.querySelector('.pf-intro'));
  console.log(s.name, { errors, afterIntro: after, introOnReloadInSameTab: second, clickSkipsWithin2s: skipped });
  await ctx.close();
}
await browser.close();
