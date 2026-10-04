// Package pages: full-page screenshots (desktop + phone), broken images,
// script errors, the WhatsApp chooser, and the home page's "More about" links.
import { chromium } from 'playwright-core';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const slugs = ['pure-furnishing', 'basic-airbnb', 'complete-airbnb', 'complete-renovation'];
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
fs.mkdirSync('lab/packages', { recursive: true });
for (const s of [
  { name: 'desk', viewport: { width: 1536, height: 864 }, deviceScaleFactor: 1 },
  { name: 'phone', viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
]) {
  const page = await browser.newPage(s);
  for (const slug of slugs) {
    const errors = [], failed = [];
    page.removeAllListeners('pageerror'); page.removeAllListeners('requestfailed');
    page.on('pageerror', e => errors.push(e.message));
    page.on('requestfailed', r => failed.push(r.url()));
    await page.goto(pathToFileURL(path.resolve(`packages/${slug}.html`)).href, { waitUntil: 'load' });
    // scroll slowly so the lazy images load, and wait for them before checking
    await page.evaluate(async () => { document.documentElement.style.scrollBehavior = 'auto'; for (let y = 0; y < document.body.scrollHeight; y += 400) { scrollTo(0, y); await new Promise(r => setTimeout(r, 150)); } });
    await page.evaluate(() => Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; }))));
    const broken = await page.$$eval('img', a => a.filter(i => i.naturalWidth === 0).map(i => i.getAttribute('src')));
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForTimeout(300);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    await page.screenshot({ path: `lab/packages/${s.name}-${slug}.png`, fullPage: true });
    await page.click('.pk-hero .pk-link');
    await page.waitForTimeout(300);
    const menu = await page.$$eval('.pf-choose.is-open a', a => a.map(x => decodeURIComponent(x.href).slice(0, 70)));
    console.log(s.name, slug, { errors, failed, broken, overflow, menu });
  }
  await page.close();
}
// home page links
const page = await browser.newPage({ viewport: { width: 1536, height: 864 } });
await page.goto(pathToFileURL(path.resolve('index.html')).href, { waitUntil: 'load' });
const links = await page.$$eval('.pf-page__link--more', a => a.map(x => x.getAttribute('href')));
console.log('home "More about" links:', links, links.every(l => fs.existsSync(l)) ? 'all exist' : 'MISSING');
await browser.close();
