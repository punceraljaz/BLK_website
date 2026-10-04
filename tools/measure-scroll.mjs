// How smooth is wheel scrolling through the packages? Starts its own static
// server for the duration of the test, scrolls with 8 mouse-wheel notches
// (100 px, 110 ms apart, like a real mouse) and records every animation frame:
// page position, the room clip's progress, and the frame time.
//   node tools/measure-scroll.mjs [label]
// Report: biggest jump in one frame (px), frames where the page stood still
// mid-gesture (stop-start = stutter), and frame-time percentiles.
import { chromium } from 'playwright-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('.');
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.h264': 'application/octet-stream', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(req.url.split('?')[0]) === '/' ? 'index.html' : decodeURIComponent(req.url.split('?')[0]));
  fs.readFile(p, (err, data) => {
    if (err) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(0);
const port = server.address().port;

const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: false, args: ['--window-position=-2400,0'] });
const page = await browser.newPage({ viewport: { width: 1536, height: 864 } });
await page.goto(`http://localhost:${port}/`, { waitUntil: 'load' });
await page.waitForTimeout(6000);                                   // load clip + frames
await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, document.getElementById('pkg-1').offsetTop); });
await page.waitForTimeout(2500);

await page.evaluate(() => {
  window.__rec = [];
  const seq = document.querySelector('.pf-room-layer').__seq;
  let last = performance.now();
  (function f(t) {
    const clip = seq.clips.find(c => c.play === 'scroll' && c.p > 0 && c.p < 1) || seq.clips[1];
    window.__rec.push({ t, dt: t - last, y: scrollY, p: clip ? clip.shown ?? clip.p : 0 });
    last = t;
    if (window.__rec.length < 600) requestAnimationFrame(f);
  })(last);
});
await page.mouse.move(700, 450);
for (let i = 0; i < 8; i++) { await page.mouse.wheel(0, 100); await page.waitForTimeout(110); }
await page.waitForTimeout(1500);
const rec = await page.evaluate(() => window.__rec);
await browser.close();
server.close();

// analyse the gesture window: first movement .. last movement
const moving = rec.map((r, i) => i ? Math.abs(r.y - rec[i - 1].y) : 0);
const first = moving.findIndex(m => m > 0), lastI = moving.length - 1 - [...moving].reverse().findIndex(m => m > 0);
const win = moving.slice(first, lastI + 1);
const still = win.filter(m => m === 0).length;
const dts = rec.slice(first, lastI + 1).map(r => r.dt).sort((a, b) => a - b);
const pct = q => dts[Math.min(dts.length - 1, Math.floor(q * dts.length))].toFixed(1);
console.log(process.argv[2] || 'run', {
  frames: win.length,
  maxJumpPx: Math.max(...win).toFixed(0),
  stillFramesMidGesture: still,
  travelledPx: (rec[lastI].y - rec[first].y).toFixed(0),
  frameMs: { p50: pct(0.5), p95: pct(0.95), max: pct(1) },
});
