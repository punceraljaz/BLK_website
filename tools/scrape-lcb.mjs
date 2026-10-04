// One-off: dump visible text of lacasabranca.com pages (reference for BLK copy).
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage({ viewport: { width: 1536, height: 864 } });
const out = [];
await page.goto('https://www.lacasabranca.com/', { waitUntil: 'load', timeout: 60000 });
const links = await page.$$eval('a[href]', as => [...new Set(as.map(a => a.href))]);
const pages = ['https://www.lacasabranca.com/', ...links.filter(h => h.startsWith('https://www.lacasabranca.com/') && !h.includes('#'))];
for (const url of [...new Set(pages)].slice(0, 15)) {
  try {
    await page.goto(url, { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(4000);
    await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); } });
    const text = await page.evaluate(() => document.body.innerText);
    out.push(`\n\n======== ${url}\n${text}`);
  } catch (e) { out.push(`\n\n======== ${url}\nERROR ${e.message}`); }
}
out.unshift('LINKS:\n' + links.join('\n'));
fs.writeFileSync(process.argv[2], out.join(''), 'utf8');
await browser.close();
