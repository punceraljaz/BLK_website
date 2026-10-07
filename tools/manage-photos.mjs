// Encode property-management photos as WebP in Chrome: node tools/manage-photos.mjs <source folder> assets/manage
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const [src, out] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage();
await page.setContent('<body></body>');
const jobs = [['hero.png', 'hero', 1600, 0.88], ...['A427','A734','A738','B139','B211','B431','F009','F306'].map(u => [u + '.jpg', u.toLowerCase(), 960, 0.84])];
for (const [f, slug, w, q] of jobs) {
  const b64 = fs.readFileSync(`${src}/${f}`).toString('base64');
  const r = await page.evaluate(async ({ b64, w, q, type }) => {
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    const bmp = await createImageBitmap(new Blob([bytes], { type }), { imageOrientation: 'from-image' });
    const s = Math.min(1, w / bmp.width);
    const c = document.createElement('canvas');
    c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
    const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(bmp, 0, 0, c.width, c.height);
    return { data: c.toDataURL('image/webp', q).split(',')[1], w: c.width, h: c.height };
  }, { b64, w, q, type: f.endsWith('png') ? 'image/png' : 'image/jpeg' });
  fs.writeFileSync(`${out}/${slug}.webp`, Buffer.from(r.data, 'base64'));
  console.log(slug, r.w + 'x' + r.h);
}
await browser.close();
