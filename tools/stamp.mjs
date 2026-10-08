// Cache busting: adds ?v=<content hash> to every local css/ and js/ link in
// the site's pages, so after a push browsers fetch changed files instead of
// reusing their cached copy (GitHub Pages lets browsers keep them 10 minutes,
// which showed new HTML with yesterday's CSS). The build scripts call it;
// after editing index.html or any css/js by hand run:  node tools/stamp.mjs
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const PAGES = ['index.html', 'manage/index.html',
  ...['packages', 'legal'].flatMap(d => fs.existsSync(d) ? fs.readdirSync(d).filter(f => f.endsWith('.html')).map(f => `${d}/${f}`) : [])];
const hashes = new Map();
const hash = file => {
  if (!hashes.has(file)) hashes.set(file, crypto.createHash('sha1').update(fs.readFileSync(file)).digest('hex').slice(0, 8));
  return hashes.get(file);
};

export function stamp(pages = PAGES) {
  for (const page of pages) {
    if (!fs.existsSync(page)) continue;
    const dir = path.dirname(page);
    const before = fs.readFileSync(page, 'utf8');
    const after = before.replace(/(href|src)="((?:\.\.\/)?(?:css|js)\/[^"?#]+\.(?:css|js))(?:\?v=[0-9a-f]*)?"/g, (m, attr, url) => {
      const file = path.join(dir, url);
      return fs.existsSync(file) ? `${attr}="${url}?v=${hash(file)}"` : m;
    });
    if (after !== before) fs.writeFileSync(page, after);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) { stamp(); console.log('stamped', PAGES.length, 'pages'); }
