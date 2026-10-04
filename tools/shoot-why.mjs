// Room → "why" handover: shots while the first story section slides over the room.
import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
for (const s of [
  { name: 'desk', viewport: { width: 1536, height: 864 }, deviceScaleFactor: 1.25 },
  { name: 'phone', viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
]) {
  const page = await browser.newPage(s);
  await page.goto('http://localhost:4500/', { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  for (const [tag, frac] of [['half', 0.5], ['top', 0.09]]) {
    await page.evaluate(f => {
      const el = document.getElementById('why');
      document.documentElement.style.scrollBehavior = 'auto';
      window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - innerHeight * f, behavior: 'instant' });
    }, frac);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `lab/story/${s.name}-why-${tag}.png` });
  }
  await page.close();
}
await browser.close();
