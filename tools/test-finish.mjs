// Auto-finish scroll: wheel a few notches from package 1, stop, and see where
// the page settles (headed Chrome, server :4500).
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: false, args: ['--window-position=0,0'] });
const p = await b.newPage({ viewport: { width: 1536, height: 864 } });
const errors = [];
p.on('pageerror', e => errors.push(e.message));
await p.goto('http://localhost:4500/#top', { waitUntil: 'load' });
await p.waitForTimeout(6000);
const tops = await p.evaluate(() => ['pkg-1', 'pkg-2', 'pkg-3', 'pkg-4', 'why'].map(id => Math.round(document.getElementById(id).getBoundingClientRect().top + scrollY)));
const where = y => { const names = ['pkg-1', 'pkg-2', 'pkg-3', 'pkg-4', 'why']; const i = tops.findIndex(t => Math.abs(t - y) <= 3); return i >= 0 ? names[i] : 'between (' + y + ')'; };
await p.mouse.move(700, 450);
async function run(label, startId, notches, dy) {
  await p.evaluate(id => { document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, document.getElementById(id).getBoundingClientRect().top + scrollY); }, startId);
  await p.waitForTimeout(800);
  for (let i = 0; i < notches; i++) { await p.mouse.wheel(0, dy); await p.waitForTimeout(90); }
  const t0 = Date.now();
  let y = -1, last = -2;
  while (Date.now() - t0 < 4000) { await p.waitForTimeout(200); last = y; y = await p.evaluate(() => Math.round(scrollY)); if (y === last) break; }
  console.log(label.padEnd(34), '->', where(y), `(settled in ~${Date.now() - t0} ms)`);
}
await run('1 notch down from pkg-1', 'pkg-1', 1, 100);
await run('4 notches down from pkg-1', 'pkg-1', 4, 100);
await run('2 notches down from pkg-2', 'pkg-2', 2, 100);
await run('3 notches up from pkg-3', 'pkg-3', 3, -100);
await run('6 notches down from pkg-4 (leaves)', 'pkg-4', 6, 100);
console.log({ errors, tops });
await b.close();
