import { chromium } from 'playwright';
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
  const html = await page.content();
  console.log(html);
  await browser.close();
})();
