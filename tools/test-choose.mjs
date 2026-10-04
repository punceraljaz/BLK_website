// Number chooser: click "Get in touch", the footer WhatsApp icon and the gallery's
// WhatsApp link; report the menu's links and screenshot each.
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
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  const menu = () => page.evaluate(() => {
    const m = document.querySelector('.pf-choose');
    return { open: m.classList.contains('is-open'), head: m.querySelector('.pf-choose__head')?.textContent, links: [...m.querySelectorAll('a')].map(a => decodeURIComponent(a.href)) };
  });
  const out = {};

  await page.click('.pf-dock__call');
  await page.waitForTimeout(400);
  out.call = await menu();
  await page.screenshot({ path: `lab/story/${s.name}-choose-call.png` });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // gallery link (scroll there so the strip builds and sets the message)
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; document.getElementById('work-wa').scrollIntoView({ block: 'center' }); });
  await page.waitForTimeout(1500);
  await page.click('#work-wa');
  await page.waitForTimeout(400);
  out.gallery = await menu();
  await page.screenshot({ path: `lab/story/${s.name}-choose-gallery.png` });
  await page.keyboard.press('Escape');

  await page.evaluate(() => document.querySelector('.pf-social a[aria-label="WhatsApp"]').scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(800);
  await page.click('.pf-social a[aria-label="WhatsApp"]');
  await page.waitForTimeout(400);
  out.footerWa = await menu();
  await page.screenshot({ path: `lab/story/${s.name}-choose-footer.png` });

  // outside click closes
  await page.mouse.click(20, 300);
  await page.waitForTimeout(300);
  out.closedAfterOutsideClick = !(await menu()).open;
  console.log(s.name, JSON.stringify({ errors, ...out }, null, 1));
  await page.close();
}
await browser.close();
