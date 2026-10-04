// Show photos side by side (browser applies their EXIF rotation) for a visual check.
//   node tools/compare-photos.mjs out.png file1 file2 [file3 ...]
import { chromium } from 'playwright-core';
import { pathToFileURL } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

// COLS / H env vars: columns and image height (default 2 / 520).
const [out, ...files] = process.argv.slice(2);
const cols = +(process.env.COLS || 2), h = +(process.env.H || 520);
const html = `<body style="margin:0;background:#222;color:#eee;font:16px sans-serif;display:grid;grid-template-columns:repeat(${cols},1fr);gap:8px;padding:8px">` +
  files.map(f => `<figure style="margin:0"><img src="${pathToFileURL(path.resolve(f)).href}" style="width:100%;height:${h}px;object-fit:contain;background:#111"><figcaption>${path.basename(f)}</figcaption></figure>`).join('') + '</body>';
fs.writeFileSync('lab/compare-photos.html', html);
const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const p = await b.newPage({ viewport: { width: 1200, height: 1100 } });
await p.goto(pathToFileURL(path.resolve('lab/compare-photos.html')).href, { waitUntil: 'load' });
await p.waitForTimeout(1200);
await p.screenshot({ path: out, fullPage: true });
await b.close();
