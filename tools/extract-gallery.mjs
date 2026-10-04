// One-off: pull the embedded photos out of "Interiors Photo Strip.html" into assets/gallery/,
// and save the gallery's CSS and JS as their own files.
import fs from 'node:fs';

const src = fs.readFileSync('C:/Users/Kugler/Downloads/Interiors Photo Strip.html', 'utf8');
fs.mkdirSync('assets/gallery', { recursive: true });

// items: { src: 'data:…', thumb: 'data:…', title: '…' }
const re = /\{\s*src:\s*'(data:image\/(\w+);base64,[^']+)',\s*thumb:\s*'(data:image\/(\w+);base64,[^']+)',\s*title:\s*'([^']*)'/g;
let m, n = 0;
const out = [];
while ((m = re.exec(src))) {
  n++;
  const slug = m[5].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const ext = e => (e === 'jpeg' ? 'jpg' : e);
  const big = `assets/gallery/${String(n).padStart(2, '0')}-${slug}.${ext(m[2])}`;
  const small = `assets/gallery/${String(n).padStart(2, '0')}-${slug}-thumb.${ext(m[4])}`;
  fs.writeFileSync(big, Buffer.from(m[1].split(',')[1], 'base64'));
  fs.writeFileSync(small, Buffer.from(m[3].split(',')[1], 'base64'));
  out.push({ src: big, thumb: small, title: m[5], kb: [fs.statSync(big).size >> 10, fs.statSync(small).size >> 10] });
}
console.log(JSON.stringify(out, null, 1));

// library CSS (first <style> after <title>) and JS (first <script>)
const css = src.match(/<style>(\/\* StripGallery[\s\S]*?)<\/style>/)[1];
const js = src.match(/<script>(\/\*![\s\S]*?StripGallery[\s\S]*?)<\/script>/)[1];
fs.writeFileSync('strip-gallery.css', css.trim() + '\n');
fs.writeFileSync('strip-gallery.js', js.trim() + '\n');
console.log('css', css.length, 'js', js.length);
