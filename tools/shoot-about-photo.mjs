// About photo: scroll so it sits under the nav, screenshot, and confirm it is
// shown whole (displayed aspect = the file's 3:4) and fully on screen.
import { chromium } from 'playwright-core';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage({ viewport: { width: 1536, height: 864 }, deviceScaleFactor: 1.25 });
await page.goto(pathToFileURL(path.resolve('index.html')).href, { waitUntil: 'load' });
await page.waitForTimeout(1000);
await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; const r = document.querySelector('.pf-about-photo').getBoundingClientRect(); window.scrollTo(0, r.top + scrollY - 100); });
await page.waitForTimeout(1500);
const m = await page.$eval('.pf-about-photo', i => { const r = i.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), aspect: +(r.width / r.height).toFixed(3), file: +(i.naturalWidth / i.naturalHeight).toFixed(3), top: Math.round(r.top), bottom: Math.round(r.bottom), vh: innerHeight, fit: getComputedStyle(i).objectFit }; });
console.log(m);
await page.screenshot({ path: 'lab/story/desk-about-photo.png' });
await browser.close();
