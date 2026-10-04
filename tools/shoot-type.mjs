// Typography check: screens of every section (home) and a package page,
// desktop + phone; reports which font families the page actually renders with.
import { chromium } from 'playwright-core';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const home = pathToFileURL(path.resolve('index.html')).href;
fs.mkdirSync('lab/type', { recursive: true });
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
for (const s of [
  { name: 'desk', viewport: { width: 1536, height: 864 }, deviceScaleFactor: 1 },
  { name: 'phone', viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true },
]) {
  const page = await browser.newPage(s);
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(home + '#top', { waitUntil: 'load' });
  await page.evaluate(() => document.querySelectorAll('img[loading=lazy]').forEach(i => i.loading = 'eager'));
  await page.waitForTimeout(5000);
  await page.screenshot({ path: `lab/type/${s.name}-01-pkg1.png` });
  let n = 2;
  for (const id of ['why', 'what-we-do', 'reviews', 'apartments', 'about', 'work']) {
    await page.evaluate(id => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, document.getElementById(id).getBoundingClientRect().top + scrollY - 40); }, id);
    await page.waitForTimeout(1300);
    await page.screenshot({ path: `lab/type/${s.name}-${String(n++).padStart(2, '0')}-${id}.png` });
  }
  const fonts = await page.evaluate(() => [...new Set([...document.querySelectorAll('body *')].filter(e => e.childNodes.length && [...e.childNodes].some(c => c.nodeType === 3 && c.textContent.trim())).map(e => getComputedStyle(e).fontFamily.split(',')[0].trim()))]);
  const italics = await page.evaluate(() => [...document.querySelectorAll('body *')].filter(e => getComputedStyle(e).fontStyle === 'italic' && e.textContent.trim()).length);
  await page.goto(pathToFileURL(path.resolve('packages/complete-airbnb.html')).href, { waitUntil: 'load' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `lab/type/${s.name}-10-package.png`, fullPage: s.name === 'desk' });
  console.log(s.name, { errors, fonts, italicElements: italics });
  await page.close();
}
await browser.close();
