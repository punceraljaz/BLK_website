// Reviews + black and white collage: viewport screenshots while scrolling (desktop + phone).
import { chromium } from 'playwright-core';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
for (const [name, opts] of [['desk', { viewport: { width: 1536, height: 864 } }], ['phone', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true }]]) {
  const p = await b.newPage(opts);
  const errors = [];
  p.on('pageerror', e => errors.push(e.message));
  await p.goto(pathToFileURL(path.resolve('index.html')).href + '#top', { waitUntil: 'load' });
  await p.evaluate(() => document.querySelectorAll('img[loading=lazy]').forEach(i => i.loading = 'eager'));
  await p.waitForTimeout(1500);
  const r = await p.evaluate(() => { const e = document.getElementById('reviews').getBoundingClientRect(); return { top: e.top + scrollY, h: e.height }; });
  for (let k = 0; k < 3; k++) {
    const y = r.top - 76 + Math.max(0, r.h - opts.viewport.height * 0.7) * k / 2;
    await p.evaluate(y => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, y); }, y);
    await p.waitForTimeout(1600);
    await p.screenshot({ path: `lab/story/${name}-reviews-${k + 1}.png` });
  }
  console.log(name, { errors, height: Math.round(r.h), overflow: await p.evaluate(() => document.documentElement.scrollWidth - innerWidth) });
  await p.close();
}
await b.close();
