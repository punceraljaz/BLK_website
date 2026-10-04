// Phone-sized screens of one package page (top + included list), and the home
// page package text with its two links (desktop + phone).
import { chromium } from 'playwright-core';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const slug = process.argv[2] || 'complete-renovation';
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const phone = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
let page = await browser.newPage(phone);
await page.goto(pathToFileURL(path.resolve(`packages/${slug}.html`)).href, { waitUntil: 'load' });
await page.waitForTimeout(800);
await page.screenshot({ path: `lab/packages/phone-${slug}-top.png` });
await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; document.querySelector('.pk-sec').scrollIntoView(); });
await page.waitForTimeout(500);
await page.screenshot({ path: `lab/packages/phone-${slug}-included.png` });
await page.close();
for (const [name, opts] of [['desk', { viewport: { width: 1536, height: 864 }, deviceScaleFactor: 1.25 }], ['phone', phone]]) {
  page = await browser.newPage(opts);
  await page.goto(pathToFileURL(path.resolve('index.html')).href, { waitUntil: 'load' });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `lab/packages/${name}-home-links.png` });
  await page.close();
}
await browser.close();
