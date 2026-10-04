// About section screenshots straight from the file (no server needed).
import { chromium } from 'playwright-core';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const url = pathToFileURL(path.resolve('index.html')).href;
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
for (const s of [
  { name: 'desk', viewport: { width: 1536, height: 864 }, deviceScaleFactor: 1.25 },
  { name: 'phone', viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
]) {
  const page = await browser.newPage(s);
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  const go = async (y, tag) => {
    await page.evaluate(y => { document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, y); }, y);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `lab/story/${s.name}-about-${tag}.png` });
  };
  const top = await page.evaluate(() => document.getElementById('about').getBoundingClientRect().top + scrollY - 76);
  const h = s.viewport.height;
  await go(top, '1');
  await go(top + h * 0.8, '2');
  await go(top + h * 1.6, '3');
  await go(1e7, 'end');
  console.log(s.name, 'overflow', await page.evaluate(() => document.documentElement.scrollWidth - innerWidth));
  await page.close();
}
await browser.close();
