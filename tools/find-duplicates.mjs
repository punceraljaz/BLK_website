// Find duplicate photos: exact (same bytes) and visual (same picture at another
// size / compression). Each image is shrunk to 24x24 grey with ffmpeg and
// compared pixel by pixel; also checks against the photos already in
// assets/gallery. Writes a labelled contact sheet for a visual check.
//   node tools/find-duplicates.mjs "C:\path\to\folder"
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright-core';
import { pathToFileURL } from 'node:url';

const dir = process.argv[2];
const N = 24;
const files = fs.readdirSync(dir).filter(f => /\.(jpe?g|png|webp|heic)$/i.test(f)).map(f => path.join(dir, f));
const gallery = fs.readdirSync('assets/gallery').filter(f => !f.includes('-thumb')).map(f => path.join('assets/gallery', f));

function sig(file) {
  const raw = execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-vf', `scale=${N}:${N},format=gray`, '-f', 'rawvideo', '-'], { maxBuffer: 1 << 20 });
  const px = [...raw.subarray(0, N * N)];
  const mean = px.reduce((a, b) => a + b, 0) / px.length;
  return px.map(v => v - mean);                                    // brightness-normalised
}
function dist(a, b) { let s = 0; for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]); return s / a.length; }
function size(file) {
  const o = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', file]).toString().trim();
  return o;
}

const all = [...files.map(f => ({ f, src: 'PICS' })), ...gallery.map(f => ({ f, src: 'gallery' }))];
for (const it of all) {
  it.md5 = crypto.createHash('md5').update(fs.readFileSync(it.f)).digest('hex');
  it.sig = sig(it.f);
  it.size = size(it.f);
  it.kb = Math.round(fs.statSync(it.f).size / 1024);
}
const pairs = [];
for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
  if (all[i].src === 'gallery' && all[j].src === 'gallery') continue;
  const d = all[i].md5 === all[j].md5 ? 0 : dist(all[i].sig, all[j].sig);
  if (d < 14) pairs.push({ a: path.basename(all[i].f), b: path.basename(all[j].f), d: +d.toFixed(1), exact: all[i].md5 === all[j].md5 });
}
pairs.sort((x, y) => x.d - y.d);
console.log('closest pairs (0 = identical, < ~6 very likely the same photo):');
for (const p of pairs) console.log(`  ${String(p.d).padStart(5)} ${p.exact ? 'EXACT' : '     '}  ${p.a}  <->  ${p.b}`);
console.log('\nsizes:');
for (const it of all) console.log(`  ${it.src.padEnd(8)} ${it.size.padEnd(10)} ${String(it.kb).padStart(6)} KB  ${path.basename(it.f)}`);

// contact sheet
const html = `<body style="margin:0;background:#222;color:#eee;font:12px sans-serif;display:grid;grid-template-columns:repeat(6,1fr);gap:6px;padding:6px">` +
  all.map(it => `<figure style="margin:0"><img src="${pathToFileURL(path.resolve(it.f)).href}" style="width:100%;height:170px;object-fit:contain;background:#111"><figcaption>${it.src === 'gallery' ? '[G] ' : ''}${path.basename(it.f)}</figcaption></figure>`).join('') + '</body>';
fs.mkdirSync('lab', { recursive: true });
fs.writeFileSync('lab/dupes-sheet.html', html);
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage({ viewport: { width: 1500, height: 900 } });
await page.goto(pathToFileURL(path.resolve('lab/dupes-sheet.html')).href, { waitUntil: 'load' });
await page.waitForTimeout(1500);
await page.screenshot({ path: 'lab/dupes-sheet.png', fullPage: true });
await browser.close();
