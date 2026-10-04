// Visual check after the editorial refinement: home (package 01 and 04),
// the gallery, a package page; desktop (1536x864 @1.25) and phone. Opens
// with #top so the intro is skipped. Reports script errors and overflow.
import { chromium } from 'playwright-core';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const home = pathToFileURL(path.resolve('index.html')).href;
const pkg = pathToFileURL(path.resolve('packages/pure-furnishing.html')).href;
fs.mkdirSync('lab/editorial', { recursive: true });
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
for (const s of [
  { name: 'desk', viewport: { width: 1536, height: 864 }, deviceScaleFactor: 1.25 },
  { name: 'phone', viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
]) {
  const page = await browser.newPage(s);
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(home + '#top', { waitUntil: 'load' });
  await page.waitForTimeout(6500);                     // load clip plays to its end
  await page.screenshot({ path: `lab/editorial/${s.name}-pkg1.png` });
  const go = async (sel, tag, off = 0) => {
    await page.evaluate(([sel, off]) => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, document.querySelector(sel).getBoundingClientRect().top + scrollY + off); }, [sel, off]);
    await page.waitForTimeout(2200);
    await page.screenshot({ path: `lab/editorial/${s.name}-${tag}.png` });
  };
  await go('#pkg-4', 'pkg4');
  await go('#work', 'work', -40);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  await page.goto(pkg, { waitUntil: 'load' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `lab/editorial/${s.name}-package.png` });
  console.log(s.name, { errors, overflow });
  await page.close();
}
await browser.close();
