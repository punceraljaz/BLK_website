// "Our work" strip: after one click on Next, record the next photo's tile
// every animation frame (x, width) in headed Chrome. Reports how long the move
// takes, the biggest single-frame jump, overshoot, and frame times; saves a few
// frames mid-move. Needs the local server on :4500.
import { chromium } from 'playwright-core';

const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: false, args: ['--window-position=0,0'] });
const page = await browser.newPage({ viewport: { width: 1536, height: 864 } });
await page.goto('http://localhost:4500/#top', { waitUntil: 'load' });
// NOFILTER=1: test without the photo filter/tint on the strip
if (process.env.NOFILTER) await page.addStyleTag({ content: '#work-strip .sg__tile img{filter:none!important}#work-strip .sg__tile::after{display:none!important}' });
await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; document.getElementById('work-strip').scrollIntoView({ block: 'center' }); });
await page.waitForTimeout(3000);
await page.evaluate(() => {
  const tiles = [...document.querySelectorAll('#work-strip .sg__tile')];
  const act = tiles.findIndex(t => t.classList.contains('is-active'));
  const next = tiles[(act + 1) % tiles.length];
  window.__rec = []; let prev = performance.now();
  (function f(t) {
    const r = next.getBoundingClientRect();
    window.__rec.push({ t, dt: t - prev, x: r.left + r.width / 2, w: r.width });
    prev = t;
    if (window.__rec.length < 120) requestAnimationFrame(f);
  })(prev);
});
await page.click('#work-strip .sg__btn[aria-label="Next photo"]');
// SHOTS=1: also save frames mid-move (screenshots stall the page, so the
// frame-time numbers are only clean without them).
if (process.env.SHOTS) for (const ms of [80, 200, 350]) { await page.waitForTimeout(ms === 80 ? 80 : ms - (ms === 200 ? 80 : 200)); await page.screenshot({ path: `lab/editorial/strip-${ms}.png` }); }
await page.waitForTimeout(2000);
const rec = await page.evaluate(() => window.__rec);
await browser.close();
const start = rec.findIndex((r, i) => i && Math.abs(r.x - rec[0].x) > 0.5);
const end = rec[rec.length - 1].x;
let settle = rec.length - 1; while (settle > 0 && Math.abs(rec[settle].x - end) < 0.5) settle--;
const jumps = rec.slice(1).map((r, i) => Math.abs(r.x - rec[i].x));
const dir = Math.sign(end - rec[0].x);
const overshoot = Math.max(0, ...rec.map(r => (r.x - end) * dir));
console.log({
  moveMs: Math.round(rec[settle].t - rec[start].t),
  maxJumpPxPerFrame: Math.round(Math.max(...jumps)),
  overshootPx: overshoot.toFixed(1),
  growPx: Math.round(rec[0].w) + ' -> ' + Math.round(rec[rec.length - 1].w),
  slowFrames: rec.filter(r => r.dt > 25).length,
});
