// About section: whole section (full-page clip) on desktop and phone, plus
// checks: the clock is filled, the photo is loaded, fonts used.
import { chromium } from 'playwright-core';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
for (const [name, opts] of [['desk', { viewport: { width: 1536, height: 864 }, deviceScaleFactor: 1 }], ['phone', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true }]]) {
  const p = await b.newPage(opts);
  const errors = [];
  p.on('pageerror', e => errors.push(e.message));
  await p.goto(pathToFileURL(path.resolve('index.html')).href + '#about', { waitUntil: 'load' });
  await p.evaluate(() => document.querySelectorAll('img[loading=lazy]').forEach(i => i.loading = 'eager'));
  await p.waitForTimeout(1500);
  const box = await p.evaluate(() => { const r = document.getElementById('about').getBoundingClientRect(); return { y: r.top + scrollY, h: r.height }; });
  await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, 0); document.querySelector('.site-bar').style.visibility = 'hidden'; document.querySelector('.pf-dock').style.visibility = 'hidden'; });
  await p.screenshot({ path: `lab/story/${name}-about-sheet.png`, fullPage: true, clip: { x: 0, y: box.y, width: opts.viewport.width, height: box.h } });
  const info = await p.evaluate(() => ({
    time: document.querySelector('.pf-about-time').textContent,
    photo: document.querySelector('.pf-about-photo').naturalWidth,
    font: getComputedStyle(document.querySelector('.pf-about-desc p')).fontFamily.split(',')[0],
    fontReady: document.fonts.check('12px "IBM Plex Mono"'),
    overflow: document.documentElement.scrollWidth - innerWidth,
  }));
  console.log(name, { errors, ...info, sectionHeight: Math.round(box.h) });
  await p.close();
}
await b.close();
