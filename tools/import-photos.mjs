// Convert photos for the "Our work" strip: decoded by Chrome (so the phone's
// EXIF rotation is applied), scaled to a 1600 px long edge (+ a 480 px thumb)
// and saved as WebP in assets/gallery/. Prints the items for index.html.
//   node tools/import-photos.mjs list.json
// list.json: [{ "file": "C:/…/photo.jpg", "slug": "10-living-room", "title": "Living Room" }, …]
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const list = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage();
await page.setContent('<body></body>');

for (const it of list) {
  const b64 = fs.readFileSync(it.file).toString('base64');
  const out = await page.evaluate(async ({ b64 }) => {
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    const bmp = await createImageBitmap(new Blob([bytes], { type: 'image/jpeg' }), { imageOrientation: 'from-image' });
    function encode(longEdge, q) {
      const s = Math.min(1, longEdge / Math.max(bmp.width, bmp.height));
      const c = document.createElement('canvas');
      c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
      const x = c.getContext('2d');
      x.imageSmoothingQuality = 'high';
      x.drawImage(bmp, 0, 0, c.width, c.height);
      return { data: c.toDataURL('image/webp', q).split(',')[1], w: c.width, h: c.height };
    }
    return { big: encode(1600, 0.82), thumb: encode(480, 0.78) };
  }, { b64 });
  fs.writeFileSync(`assets/gallery/${it.slug}.webp`, Buffer.from(out.big.data, 'base64'));
  fs.writeFileSync(`assets/gallery/${it.slug}-thumb.webp`, Buffer.from(out.thumb.data, 'base64'));
  console.error(`${it.slug}: ${out.big.w}x${out.big.h}, ${Math.round(Buffer.from(out.big.data, 'base64').length / 1024)} KB`);
}
await browser.close();
for (const it of list) {
  console.log(`        { src: g + '${it.slug}.webp', thumb: g + '${it.slug}-thumb.webp', title: '${it.title}' },`);
}
