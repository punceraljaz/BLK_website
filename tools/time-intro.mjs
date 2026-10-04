// Intro timing: phases with their times (window.__pfIntro.log), 3 runs each on
// desktop and phone, plus a click-to-skip run. Default target: the file.
//   node tools/time-intro.mjs [http://localhost:4500/]
import { chromium } from 'playwright-core';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const base = process.argv[2] || pathToFileURL(path.resolve('index.html')).href;
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
for (const s of [
  { name: 'desk', viewport: { width: 1536, height: 864 }, deviceScaleFactor: 1 },
  { name: 'phone', viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
]) {
  for (let run = 1; run <= 3; run++) {
    const ctx = await browser.newContext(s);
    const page = await ctx.newPage();
    await page.goto(base + '?intro', { waitUntil: 'commit' });
    await page.waitForTimeout(9500);
    const r = await page.evaluate(() => ({ log: window.__pfIntro && window.__pfIntro.log, nav: Math.round(performance.getEntriesByType('navigation')[0].domContentLoadedEventEnd), stillOn: document.documentElement.classList.contains('intro-run') }));
    console.log(s.name, 'run', run, JSON.stringify(r));
    await ctx.close();
  }
  const ctx = await browser.newContext(s);
  const page = await ctx.newPage();
  await page.goto(base + '?intro', { waitUntil: 'load' });
  await page.waitForTimeout(900);
  const before = await page.evaluate(() => window.__pfIntro.log.slice());
  await page.mouse.click(200, 200);
  await page.waitForTimeout(2500);
  const r = await page.evaluate(() => ({ log: window.__pfIntro.log, stillOn: document.documentElement.classList.contains('intro-run') }));
  console.log(s.name, 'click-skip', JSON.stringify({ before, ...r }));
  await ctx.close();
}
await browser.close();
