// The flow spread (#why + #what-we-do): viewport screenshots while scrolling
// through it (desktop + phone), so the reveals and the photo cross-fade play.
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
  const r = await p.evaluate(() => { const e = document.querySelector('.pf-flow').getBoundingClientRect(); return { top: e.top + scrollY, h: e.height }; });
  const steps = 5;
  for (let k = 0; k < steps; k++) {
    const y = r.top - 76 + (r.h - opts.viewport.height * 0.6) * k / (steps - 1);
    await p.evaluate(y => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, y); }, y);
    await p.waitForTimeout(1700);
    await p.screenshot({ path: `lab/story/${name}-flow-${k + 1}.png` });
  }
  console.log(name, { errors, flowHeight: Math.round(r.h), overflow: await p.evaluate(() => document.documentElement.scrollWidth - innerWidth) });
  await p.close();
}
await b.close();
