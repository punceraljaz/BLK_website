// Auto finish: no pause mid-transition, where it lands, and that the visitor
// can always scroll during the finishing glide. Headed Chrome at the client's
// size; starts its own server.   node tools/test-finish.mjs
import { chromium } from 'playwright-core';
import { serve } from './serve.mjs';

const { url, close } = await serve();
const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: false, args: ['--window-position=-2400,0', '--window-size=1560,1000'],
});
const ctx = await browser.newContext({ viewport: { width: 1536, height: 864 }, deviceScaleFactor: 1.25 });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
await page.goto(url + '#top', { waitUntil: 'load' });
await page.waitForTimeout(6000);
const names = ['pkg-1', 'pkg-2', 'pkg-3', 'pkg-4', 'about'];
const tops = await page.evaluate(n => n.map(id => Math.round(document.getElementById(id).getBoundingClientRect().top + scrollY)), names);
const where = y => { const i = tops.findIndex(t => Math.abs(t - y) <= 3); return i >= 0 ? names[i] : 'between (' + y + ')'; };
const jump = async id => { await page.evaluate(y => scrollTo({ top: y, behavior: 'instant' }), tops[names.indexOf(id)]); await page.waitForTimeout(900); };
// Record scrollY every frame until it rests 30 frames.
const record = () => page.evaluate(() => { window.__rec = []; if (!window.__recOn) { window.__recOn = 1; (function f() { __rec.push(scrollY); requestAnimationFrame(f); })(); } });
const settle = async () => {
  for (let k = 0; k < 40; k++) {
    await page.waitForTimeout(150);
    const r = await page.evaluate(() => __rec.slice(-30));
    if (r.length === 30 && r.every(v => v === r[0])) break;
  }
  return page.evaluate(() => __rec);
};
// Longest run of still frames between the first move and the landing.
const stall = ys => {
  const first = ys.findIndex(v => v !== ys[0]); let last = ys.length - 1;
  while (last > 0 && ys[last] === ys[last - 1]) last--;
  let run = 0, max = 0;
  for (let i = first + 1; i <= last; i++) { run = ys[i] === ys[i - 1] ? run + 1 : 0; max = Math.max(max, run); }
  return { frames: last - first, longestStill: max };
};
const out = { tops: Object.fromEntries(names.map((n, i) => [n, tops[i]])) };
for (const [name, start, notches, dy, gap] of [
  ['1 notch down from pkg-1', 'pkg-1', 1, 100, 90], ['3 notches down from pkg-1', 'pkg-1', 3, 100, 90],
  ['4 notches down from pkg-1', 'pkg-1', 4, 100, 90], ['2 notches down from pkg-2', 'pkg-2', 2, 100, 90],
  ['3 notches up from pkg-3', 'pkg-3', 3, -100, 90], ['3 slow notches down from pkg-2', 'pkg-2', 3, 100, 300],
]) {
  await jump(start); await record();
  for (let i = 0; i < notches; i++) { await page.mouse.wheel(0, dy); await page.waitForTimeout(gap); }
  const ys = await settle();
  out[name] = { lands: where(ys.at(-1)), ...stall(ys) };
}
// Scroll back up in the middle of a finishing glide: the visitor must win.
await jump('pkg-1'); await record();
for (let i = 0; i < 3; i++) { await page.mouse.wheel(0, 100); await page.waitForTimeout(90); }
await page.waitForTimeout(350);
const mid = await page.evaluate(() => ({ y: scrollY, auto: !!document.querySelector('.pf-room-layer').__seq.auto }));
for (let i = 0; i < 6; i++) { await page.mouse.wheel(0, -100); await page.waitForTimeout(60); }
const ys = await settle();
out['wheel up during glide'] = { glidingAt: Math.round(mid.y), wasGliding: mid.auto, lands: where(ys.at(-1)) };
// Keyboard: arrow keys mid-transition.
await jump('pkg-2'); await record();
for (let i = 0; i < 4; i++) { await page.keyboard.press('ArrowDown'); await page.waitForTimeout(80); }
out['4 arrow-downs from pkg-2'] = { lands: where((await settle()).at(-1)) };
out.errors = errors;
await browser.close(); close();
console.log(JSON.stringify(out, null, 1));
