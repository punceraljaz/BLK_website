// Minimal static server for the test scripts (no install needed).
//   import { serve } from './serve.mjs'; const { url, close } = await serve();
// Also runnable on its own:  node tools/serve.mjs [port]   (default 4500)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const TYPES = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.json': 'application/json', '.h264': 'application/octet-stream', '.woff2': 'font/woff2',
};

export function serve(port = 0, root = path.resolve('.')) {
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
    if (p.endsWith('/')) p += 'index.html';
    const file = path.join(root, p);
    if (!file.startsWith(root)) { res.writeHead(403); res.end(); return; }
    fs.readFile(file, (err, data) => {
      if (err) { res.writeHead(404); res.end(); return; }
      // no-cache: browsers (phones especially) always check for the latest file while we iterate.
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
      res.end(data);
    });
  });
  return new Promise(resolve => server.listen(port, () => resolve({
    url: `http://localhost:${server.address().port}/`,
    close: () => server.close(),
  })));
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  const { url } = await serve(+process.argv[2] || 4500);
  console.log('Serving', path.resolve('.'), 'at', url);
}
