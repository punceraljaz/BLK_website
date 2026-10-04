// Performance + scroll behaviour of the room, in headed Chrome (real GPU) at the
// client's screen (1536x864 @1.25). Starts its own server. Replaces the old
// measure-lag / measure-scroll / test-finish scripts.
//   1  idle: main-thread busy time per second while the page sits on a package
//   2  wheel through packages 1 -> 4 (one notch every 90 ms): fps, frame-time
//      percentiles, frames over 25 ms, biggest jump in one frame, still frames
//   3  auto finish: where the page settles after a few wheel notches
//   node tools/measure.mjs [label] [--images]   (--images: no WebCodecs, like phones on the LAN)
import { chromium } from 'playwright-core';
import { serve } from './serve.mjs';

const label = process.argv.slice(2).find(a => !a.startsWith('--')) || 'run';
const images = process.argv.includes('--images');
const { url, close } = await serve();
const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: false, args: ['--window-position=-2400,0', '--window-size=1560,1000'],
});
const ctx = await browser.newContext({ viewport: { width: 1536, height: 864 }, deviceScaleFactor: 1.25 });
const page = await ctx.newPage();
if (images) await page.addInitScript(() => { delete window.VideoDecoder; delete window.EncodedVideoChunk; });
const errors = [];
page.on('pageerror', e => errors.push(e.message));
await page.goto(url + '#top', { waitUntil: 'load' });
await page.waitForTimeout(9000);                          // clip 1 + all frames downloaded
const top = id => page.evaluate(id => Math.round(document.getElementById(id).getBoundingClientRect().top + scrollY), id);
const jump = async id => { const y = await top(id); await page.evaluate(y => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, y); }, y); };
const result = { label, mode: await page.evaluate(() => document.querySelector('.pf-room-layer').__seq.clips.map(c => c.set.useVideo ? 'video' : 'img').join(',')) };

// 1 idle
await jump('pkg-2');
await page.waitForTimeout(3000);
const cdp = await ctx.newCDPSession(page);
await cdp.send('Performance.enable');
const m = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x => [x.name, x.value]));
const a = await m();
await page.waitForTimeout(4000);
const b = await m();
const per = k => ((b[k] - a[k]) / 4 * 1000).toFixed(1) + ' ms/s';
result.idle = { task: per('TaskDuration'), script: per('ScriptDuration'), styleRecalcs: ((b.RecalcStyleCount - a.RecalcStyleCount) / 4).toFixed(1) + '/s', layouts: ((b.LayoutCount - a.LayoutCount) / 4).toFixed(1) + '/s' };

// 2 wheel through the packages
await jump('pkg-1');
await page.waitForTimeout(2000);
await page.evaluate(() => {
  window.__rec = []; window.__stop = false;
  let prev = performance.now();
  (function f(t) { window.__rec.push({ dt: t - prev, y: scrollY }); prev = t; if (!window.__stop) requestAnimationFrame(f); })(prev);
});
const m0 = await m();
await page.mouse.move(400, 450);
const end = await top('pkg-4');
for (let i = 0; i < 400; i++) {
  if (await page.evaluate(e => scrollY >= e - 2, end)) break;
  await page.mouse.wheel(0, 100);
  await page.waitForTimeout(90);
}
await page.waitForTimeout(800);
const m1 = await m();
const rec = (await page.evaluate(() => { window.__stop = true; return window.__rec; })).slice(5);
const dts = rec.map(x => x.dt).sort((x, y) => x - y);
const q = p => dts[Math.min(dts.length - 1, Math.floor(p * dts.length))].toFixed(1);
const total = rec.reduce((s, x) => s + x.dt, 0);
const moves = rec.map((r, i) => i ? Math.abs(r.y - rec[i - 1].y) : 0);
const first = moves.findIndex(v => v > 0), last = moves.length - 1 - [...moves].reverse().findIndex(v => v > 0);
const win = moves.slice(first, last + 1);
result.scroll = {
  seconds: (total / 1000).toFixed(1), fps: (rec.length / total * 1000).toFixed(1),
  frameMs: { p50: q(0.5), p90: q(0.9), p99: q(0.99), max: q(1) },
  over25ms: rec.filter(x => x.dt > 25).length + ' of ' + rec.length,
  maxJumpPx: Math.max(...win).toFixed(0), stillFrames: win.filter(v => v === 0).length,
  mainThread: ((m1.TaskDuration - m0.TaskDuration) / (total / 1000) * 1000).toFixed(0) + ' ms/s',
};
const share = k => ((m1[k] - m0[k]) / (total / 1000) * 1000).toFixed(0) + ' ms/s';
result.scroll.split = { script: share('ScriptDuration'), style: share('RecalcStyleDuration'), layout: share('LayoutDuration'), styleRecalcs: m1.RecalcStyleCount - m0.RecalcStyleCount };

// 3 auto finish
const names = ['pkg-1', 'pkg-2', 'pkg-3', 'pkg-4', 'why'];
const tops = await Promise.all(names.map(top));
const where = y => { const i = tops.findIndex(t => Math.abs(t - y) <= 3); return i >= 0 ? names[i] : 'between (' + y + ')'; };
result.finish = {};
for (const [name, start, notches, dy] of [
  ['1 notch down from pkg-1', 'pkg-1', 1, 100], ['4 notches down from pkg-1', 'pkg-1', 4, 100],
  ['2 notches down from pkg-2', 'pkg-2', 2, 100], ['3 notches up from pkg-3', 'pkg-3', 3, -100],
]) {
  await jump(start);
  await page.waitForTimeout(800);
  for (let i = 0; i < notches; i++) { await page.mouse.wheel(0, dy); await page.waitForTimeout(90); }
  let y = -1, prev;
  for (let k = 0; k < 25; k++) { await page.waitForTimeout(200); prev = y; y = await page.evaluate(() => Math.round(scrollY)); if (y === prev) break; }
  result.finish[name] = where(y);
}
result.errors = errors;
await browser.close();
close();
console.log(JSON.stringify(result, null, 1));
