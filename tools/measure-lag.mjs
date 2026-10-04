// Where does the desktop lag come from? Headed Chrome (real GPU) at the
// client's size (1536x864 @1.25), scrolls with the mouse wheel through all four
// packages and records every animation frame. Variants:
//   A  as is (GPU H.264 frames via WebCodecs)
//   B  images instead of video (VideoDecoder hidden, like the phone uses)
//   C  as is, but no backdrop blur on the dock button
// Report per variant: fps, frame-time percentiles, frames > 25 ms, how many
// different room frames were shown, and the chain's decode mode.
// Needs the local server on :4500.   node tools/measure-lag.mjs [A B C]
import { chromium } from 'playwright-core';

const variants = process.argv.slice(2).length ? process.argv.slice(2) : ['A', 'B', 'C'];
const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: false, args: ['--window-position=0,0', '--window-size=1560,1000'],
});

for (const v of variants) {
  const ctx = await browser.newContext({ viewport: { width: 1536, height: 864 }, deviceScaleFactor: 1.25 });
  const page = await ctx.newPage();
  if (v === 'B') await page.addInitScript(() => { delete window.VideoDecoder; delete window.EncodedVideoChunk; });
  await page.goto('http://localhost:4500/', { waitUntil: 'load' });
  if (v === 'C') await page.addStyleTag({ content: '.pf-dock__call{-webkit-backdrop-filter:none!important;backdrop-filter:none!important}' });
  await page.waitForTimeout(9000);                          // load clip + all frames
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, document.getElementById('pkg-1').offsetTop); });
  await page.waitForTimeout(2000);

  await page.evaluate(() => {
    const seq = document.querySelector('.pf-room-layer').__seq;
    window.__rec = []; window.__stop = false;
    let prev = performance.now();
    (function f(t) {
      window.__rec.push({ dt: t - prev, y: scrollY, key: seq.lastKey });
      prev = t;
      if (!window.__stop) requestAnimationFrame(f);
    })(prev);
  });
  await page.mouse.move(400, 450);
  const end = await page.evaluate(() => document.getElementById('why').offsetTop - innerHeight);
  // a steady scroll like a person reading through: one notch every 90 ms
  for (let i = 0; i < 400; i++) {
    if (await page.evaluate(e => scrollY >= e, end)) break;
    await page.mouse.wheel(0, 100);
    await page.waitForTimeout(90);
  }
  await page.waitForTimeout(800);
  const res = await page.evaluate(() => {
    window.__stop = true;
    const seq = document.querySelector('.pf-room-layer').__seq;
    return { rec: window.__rec, mode: seq.clips.map(c => c.set.useVideo ? 'video' : 'img').join(',') };
  });
  const r = res.rec.slice(5);
  const dts = r.map(x => x.dt).sort((a, b) => a - b);
  const q = p => dts[Math.min(dts.length - 1, Math.floor(p * dts.length))].toFixed(1);
  const total = r.reduce((s, x) => s + x.dt, 0);
  const keys = new Set(r.map(x => x.key)).size;
  console.log(v, {
    mode: res.mode,
    seconds: (total / 1000).toFixed(1),
    fps: (r.length / total * 1000).toFixed(1),
    frameMs: { p50: q(0.5), p90: q(0.9), p99: q(0.99), max: q(1) },
    over25ms: r.filter(x => x.dt > 25).length + ' of ' + r.length,
    roomFramesShown: keys,
  });
  await ctx.close();
}
await browser.close();
