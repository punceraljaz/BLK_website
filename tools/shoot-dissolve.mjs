// Intro ending: waits for the 'reveal' phase (window.__pfIntro.log), then
// screenshots at fixed offsets into the dissolve. From the file.
import { chromium } from 'playwright-core';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const url = pathToFileURL(path.resolve('index.html')).href + '?intro';
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage({ viewport: { width: 1536, height: 864 } });
await page.goto(url, { waitUntil: 'commit' });
await page.waitForFunction(() => window.__pfIntro && window.__pfIntro.log.some(l => l.startsWith('reveal')), null, { timeout: 15000, polling: 16 });
const t0 = Date.now();
for (const ms of [0, 300, 650, 1000, 1350]) {
  const wait = ms - (Date.now() - t0);
  if (wait > 0) await page.waitForTimeout(wait);
  await page.screenshot({ path: `lab/intro/dissolve-${String(ms).padStart(4, '0')}.png` });
}
await browser.close();
