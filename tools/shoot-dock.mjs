// Contact dock: shots at the top, mid-page and the footer, desktop + phone (from the file).
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
  const shot = async (y, tag) => {
    await page.evaluate(y => { document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, y); }, y);
    await page.waitForTimeout(1300);
    await page.screenshot({ path: `lab/story/${s.name}-dock-${tag}.png` });
  };
  await shot(0, 'top');
  await shot(await page.evaluate(() => document.getElementById('reviews').offsetTop), 'mid');
  await shot(1e7, 'end');
  const links = await page.$$eval('.pf-dock a', as => as.map(a => a.href));
  console.log(s.name, links);
  await page.close();
}
await browser.close();
