// Desktop: click the big photo in "Our work" -> lightbox opens.
import { chromium } from 'playwright-core';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage({ viewport: { width: 1536, height: 864 }, deviceScaleFactor: 1.25 });
await page.goto(pathToFileURL(path.resolve('index.html')).href, { waitUntil: 'load' });
await page.waitForTimeout(1200);
await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; const r = document.getElementById('work-strip').getBoundingClientRect(); window.scrollTo(0, r.top + scrollY - 120); });
await page.waitForTimeout(1500);
// step to photo 13 (a portrait one) with the arrow, then shoot the strip
for (let i = 0; i < 12; i++) { await page.click('#work-strip .sg__btn[aria-label="Next photo"]'); await page.waitForTimeout(220); }
await page.waitForTimeout(800);
await page.screenshot({ path: 'lab/story/desk-work-portrait.png' });
const big = await page.$eval('#work-strip .sg__tile.is-active', e => { const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 3 }; });
await page.mouse.move(big.x, big.y);
await page.mouse.down(); await page.mouse.up();
await page.waitForTimeout(800);
console.log('lightbox open:', await page.evaluate(() => !!document.querySelector('.sg-lb.is-open')));
await page.screenshot({ path: 'lab/story/desk-work-lightbox.png' });
await browser.close();
