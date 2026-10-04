// Screenshot one section straight from the file: node lab/shoot-one.mjs <id>
import { chromium } from 'playwright-core';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const id = process.argv[2];
const url = pathToFileURL(path.resolve('index.html')).href;
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
for (const s of [
  { name: 'desk', viewport: { width: 1536, height: 864 }, deviceScaleFactor: 1.25 },
  { name: 'phone', viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
]) {
  const page = await browser.newPage(s);
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  const top = await page.evaluate(id => document.getElementById(id).getBoundingClientRect().top + scrollY, id);
  for (const [tag, dy] of [['1', 0], ['2', s.viewport.height * 0.8]]) {
    await page.evaluate(y => { document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, y); }, top + dy);
    await page.waitForTimeout(1400);
    await page.screenshot({ path: `lab/story/${s.name}-${id}-${tag}.png` });
  }
  await page.close();
}
await browser.close();
