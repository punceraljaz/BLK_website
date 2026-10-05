// Smoke test for the whole site (replaces the old one-off shoot-*/test-* scripts).
// Starts its own server, then on desktop (1536x864 @1.25, the client's screen)
// and phone (390x844):
//   - home page: script errors, failed requests, broken images
//   - a screenshot at every section (packages 1-4, about, work, footer)
//   - which package text is shown at each package, and the wide room on package 4
//   - the TV-corner view switch, the number chooser, the "Our work" strip
//   - the intro (?intro): it runs, releases the room, and a click skips it
//   - the four package pages: errors + broken images + a screenshot
// Screenshots go to lab/check/<label>/.   node tools/check.mjs [label]
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import { serve } from './serve.mjs';

const label = process.argv[2] || 'run';
const out = `lab/check/${label}`;
fs.mkdirSync(out, { recursive: true });
const { url, close } = await serve();
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const DEVICES = {
  desk: { viewport: { width: 1536, height: 864 }, deviceScaleFactor: 1.25 },
  phone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};
const report = {};

function watch(page) {
  const r = { errors: [], failed: [] };
  page.on('pageerror', e => r.errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') r.errors.push(m.text()); });
  page.on('requestfailed', q => { if (!q.url().includes('fonts.g')) r.failed.push(q.url().replace(url, '')); });
  page.on('response', q => { if (q.status() >= 400) r.failed.push(q.status() + ' ' + q.url().replace(url, '')); });
  return r;
}
const broken = page => page.$$eval('img', a => a.filter(i => i.complete && i.getAttribute('src') && !i.naturalWidth).map(i => i.getAttribute('src')));
async function scrollToId(page, id, extra = 0) {
  await page.evaluate(([id, extra]) => {
    document.documentElement.style.scrollBehavior = 'auto';
    scrollTo(0, document.getElementById(id).getBoundingClientRect().top + scrollY + extra);
  }, [id, extra]);
  await page.waitForTimeout(1600);
}

// The cookie banner (js/consent.js) would cover the dock and footer in a fresh
// profile: store a choice first, as a returning visitor would have.
const NO_BANNER = () => { try { localStorage.setItem('blk-consent', JSON.stringify({ v: 1, t: Date.now(), necessary: true, analytics: false, marketing: false })); } catch (e) {} };

for (const [dev, opts] of Object.entries(DEVICES)) {
  const R = report[dev] = {};
  const ctx = await browser.newContext(opts);
  await ctx.addInitScript(NO_BANNER);
  const page = await ctx.newPage();
  const w = watch(page);
  await page.goto(url + '#top', { waitUntil: 'load' });
  await page.waitForTimeout(6500);                    // clip 1 plays on load

  // packages: which text is current, room width, screenshot
  R.packages = {};
  for (const id of ['pkg-1', 'pkg-2', 'pkg-3', 'pkg-4']) {
    await scrollToId(page, id);
    R.packages[id] = await page.evaluate(() => ({
      current: document.querySelector('.is-current')?.id || null,
      wide: document.documentElement.classList.contains('room-wide'),
      canvasShown: getComputedStyle(document.querySelector('.pf-room-layer .seq__canvas')).visibility,
      frame: document.querySelector('.pf-room-layer').__seq?.lastKey,
    }));
    await page.screenshot({ path: `${out}/${dev}-${id}.png` });
  }
  // TV-corner view on package 2, then back to the bedroom
  await scrollToId(page, 'pkg-2');
  await page.click('#pkg-2 .pf-room[data-view="tv"]');
  await page.waitForTimeout(3500);
  R.tvView = await page.evaluate(() => ({
    viewTv: document.documentElement.classList.contains('view-tv'),
    tvFrame: document.querySelector('.pf-tv-view').__seq?.lastKey,
    pressed: [...document.querySelectorAll('.pf-room[aria-pressed="true"]')].map(b => b.dataset.caption),
  }));
  await page.screenshot({ path: `${out}/${dev}-pkg-2-tv.png` });
  await page.click('#pkg-2 .pf-room[data-view="bedroom"]');
  await page.waitForTimeout(900);
  R.tvView.backToBedroom = await page.evaluate(() => !document.documentElement.classList.contains('view-tv'));

  // the story sections and the end of the page
  for (const id of ['about', 'work']) {
    await scrollToId(page, id);
    await page.screenshot({ path: `${out}/${dev}-${id}.png` });
  }
  R.afterRoom = await page.evaluate(() => document.querySelector('.is-current')?.id || null);
  R.revealed = await page.evaluate(() => [...document.querySelectorAll('[data-sc-in]')].filter(e => e.getBoundingClientRect().top < innerHeight && !e.classList.contains('sc-in')).length);
  R.gallery = await page.evaluate(() => ({ tiles: document.querySelectorAll('#work-strip .sg__tile').length, wa: document.getElementById('work-wa').getAttribute('data-wa-text') }));
  await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${out}/${dev}-footer.png` });

  // number chooser from the dock
  await page.click('.pf-dock__call');
  await page.waitForTimeout(300);
  R.chooser = await page.$$eval('.pf-choose.is-open a', a => a.map(x => x.getAttribute('href')));
  await page.keyboard.press('Escape');

  R.broken = await broken(page);
  R.errors = w.errors; R.failed = [...new Set(w.failed)];
  await ctx.close();

  // intro: forced with ?intro, releases the room at ~3 s; a second run is skipped by a click
  const ictx = await browser.newContext(opts);
  await ictx.addInitScript(NO_BANNER);
  const ip = await ictx.newPage();
  const iw = watch(ip);
  await ip.goto(url + '?intro', { waitUntil: 'load' });
  await ip.waitForTimeout(1500);
  await ip.screenshot({ path: `${out}/${dev}-intro.png` });
  await ip.waitForTimeout(4500);
  R.intro = await ip.evaluate(() => ({
    log: (window.__pfIntro?.log || []).map(s => s.split(' ')[0]).join(' > '),
    gone: !document.querySelector('.pf-intro'), current: document.querySelector('.is-current')?.id || null,
  }));
  await ip.goto(url + '?intro', { waitUntil: 'load' });
  await ip.waitForTimeout(600);
  await ip.mouse.click(200, 200);
  await ip.waitForTimeout(1200);
  R.introSkip = await ip.evaluate(() => (window.__pfIntro?.log || []).map(s => s.split(' ')[0]).join(' > '));
  R.introErrors = iw.errors;
  await ictx.close();

  // package pages
  R.pages = {};
  const pctx = await browser.newContext(opts);
  await pctx.addInitScript(NO_BANNER);
  for (const slug of ['furnishing', 'basic-airbnb', 'upscale-airbnb', 'donna-branka']) {
    const pp = await pctx.newPage();
    const pw = watch(pp);
    await pp.goto(url + `packages/${slug}.html`, { waitUntil: 'load' });
    await pp.waitForTimeout(500);
    await pp.screenshot({ path: `${out}/${dev}-page-${slug}.png`, fullPage: true });
    R.pages[slug] = { errors: pw.errors, failed: pw.failed, broken: await broken(pp) };
    await pp.close();
  }
  await pctx.close();
}

await browser.close();
close();
console.log(JSON.stringify(report, null, 1));
console.log('Screenshots:', out);
