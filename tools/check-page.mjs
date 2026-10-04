// Smoke test after changes: open index.html from the file, report script errors
// and any CSS/JS/image that failed to load (video frames are skipped: they need
// the local server). Run from the project root: node tools/check-page.mjs
import { chromium } from 'playwright-core';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage({ viewport: { width: 1536, height: 864 } });
const errors = [], failed = [];
page.on('pageerror', e => errors.push(e.message));
page.on('requestfailed', r => { if (!r.url().includes('/frames/')) failed.push(r.url()); });
await page.goto(pathToFileURL(path.resolve('index.html')).href, { waitUntil: 'load' });
await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); } });
await page.waitForTimeout(1000);
const styled = await page.evaluate(() => getComputedStyle(document.querySelector('.pf-dock')).position);
const libs = await page.evaluate(() => ({ StripGallery: !!window.StripGallery, chain: !!document.querySelector('[data-seq-chain]').__seq }));
const broken = await page.$$eval('img', imgs => imgs.filter(i => i.complete && i.naturalWidth === 0 && i.getAttribute('src')).map(i => i.getAttribute('src')));
console.log({ errors, failed, brokenImages: broken, dockPosition: styled, libs });
await browser.close();
