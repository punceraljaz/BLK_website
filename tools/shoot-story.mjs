// Screenshots of the story sections (after the room) on desktop and phone.
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const outDir = 'lab/story';
fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const sizes = [
  { name: 'desk', viewport: { width: 1536, height: 864 }, deviceScaleFactor: 1.25 },
  { name: 'phone', viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
];
for (const s of sizes) {
  const page = await browser.newPage(s);
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://localhost:4500/', { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  for (const id of ['why', 'what-we-do', 'reviews', 'apartments', 'about']) {
    await page.evaluate(id => { const el = document.getElementById(id); window.scrollTo(0, el.getBoundingClientRect().top + scrollY - 76); }, id);
    await page.waitForTimeout(1400);
    await page.screenshot({ path: `${outDir}/${s.name}-${id}.png` });
    // second screen for tall sections
    await page.evaluate(() => window.scrollBy(0, innerHeight * 0.85));
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${outDir}/${s.name}-${id}-b.png` });
  }
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${outDir}/${s.name}-foot.png` });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  console.log(s.name, 'errors:', errors.length ? errors : 'none', 'h-overflow:', overflow);
  await page.close();
}
await browser.close();
