// "Our work" strip: screenshots + behaviour checks (from the file, no server).
import { chromium } from 'playwright-core';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const url = pathToFileURL(path.resolve('index.html')).href;
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
for (const s of [
  { name: 'desk', viewport: { width: 1536, height: 864 }, deviceScaleFactor: 1.25 },
  { name: 'phone', viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
]) {
  const page = await browser.newPage(s);
  const errors = [];
  let galleryRequests = 0;
  page.on('pageerror', e => errors.push(e.message));
  page.on('request', r => { if (r.url().includes('/gallery/')) galleryRequests++; });
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  const galleryRequestsAtLoad = galleryRequests;
  const top = await page.evaluate(() => document.getElementById('work').getBoundingClientRect().top + scrollY - 76);
  await page.evaluate(y => { document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, y); }, top);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `lab/story/${s.name}-work-1.png` });
  await page.evaluate(() => window.scrollBy(0, innerHeight * 0.6));
  await page.waitForTimeout(800);
  await page.screenshot({ path: `lab/story/${s.name}-work-2.png` });

  const cap = () => page.$eval('#work-strip .sg__count', e => e.textContent);
  const before = await cap();
  await page.click('#work-strip .sg__btn[aria-label="Next photo"]');
  await page.waitForTimeout(900);
  const after = await cap();
  const wa = await page.$eval('#work-wa', a => decodeURIComponent(a.href));

  let wheel = 'n/a';
  if (s.name === 'desk') {
    const box = await page.$eval('#work-strip', e => { const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
    await page.mouse.move(box.x, box.y);
    const y0 = await page.evaluate(() => scrollY);
    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(600);
    wheel = (await page.evaluate(() => scrollY)) - y0;
  }

  // enlarge: click the big photo
  const big = await page.$eval('#work-strip .sg__tile.is-active', e => { const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
  await page.mouse.click(big.x, big.y);
  await page.waitForTimeout(700);
  const lbOpen = await page.evaluate(() => !!document.querySelector('.sg-lb.is-open'));
  await page.screenshot({ path: `lab/story/${s.name}-work-lightbox.png` });
  await page.keyboard.press('Escape');

  console.log(s.name, { errors, galleryRequestsAtLoad, before, after, wa, wheelScrolledPage: wheel, lbOpen });
  await page.close();
}
await browser.close();
