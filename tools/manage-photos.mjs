// Encode the property-management photos as WebP in Chrome (matches the source
// colours; ffmpeg's libwebp shifted them). Sources = the image files of the
// client's ChatGPT site blk-orlovic-management.bradekeco.chatgpt.site/images/
// (clients/ flattened into the same folder):
//   node tools/manage-photos.mjs <source folder> assets/manage [one output name]
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const [src, out] = process.argv.slice(2);
const TYPE = { png: 'image/png', webp: 'image/webp' };
// [source file, output name, max width, quality, crop x y w h of the source]
const jobs = [
  ['managed-apartment-hero.jpg', 'hero', 1600, 0.88],
  ['managed-apartment-view.jpg', 'view', 1600, 0.86],
  ['managed-apartment-living.jpg', 'living', 1280, 0.86],
  ['management-exposure-comparison.png', 'comparison', 1536, 0.92],
  ['area-al-marjan-island.webp', 'area-al-marjan-island', 720, 0.8, [72, 64, 536, 388]],   // without the white frame
  ...['pacific.webp', 'bab-al-bahr.webp', 'al-hamra.jfif', 'royal-breeze.jpg',
      'mina-al-arab.jpg', 'ras-al-khaimah.webp', 'umm-al-quwain.jpg'].map(f => ['area-' + f, 'area-' + f.split('.')[0], 720, 0.8]),
  ...['aljosa', 'gugi', 'dejan', 'simona', 'peter'].map(n => [n + '.jpg', 'client-' + n, 360, 0.84]),
];
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage();
await page.setContent('<body></body>');
const only = process.argv[4];                            // optional: one output name
for (const [f, slug, w, q, crop] of jobs) {
  if (only && slug !== only) continue;
  const b64 = fs.readFileSync(`${src}/${f}`).toString('base64');
  const r = await page.evaluate(async ({ b64, w, q, type, crop }) => {
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    const blob = new Blob([bytes], { type });
    const bmp = crop ? await createImageBitmap(blob, ...crop) : await createImageBitmap(blob, { imageOrientation: 'from-image' });
    const s = Math.min(1, w / bmp.width);
    const c = document.createElement('canvas');
    c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
    const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(bmp, 0, 0, c.width, c.height);
    return { data: c.toDataURL('image/webp', q).split(',')[1], w: c.width, h: c.height };
  }, { b64, w, q, crop, type: TYPE[f.split('.').pop()] || 'image/jpeg' });
  fs.writeFileSync(`${out}/${slug}.webp`, Buffer.from(r.data, 'base64'));
  console.log(slug, r.w + 'x' + r.h, Math.round(r.data.length * 0.75 / 1024) + ' KB');
}
await browser.close();
