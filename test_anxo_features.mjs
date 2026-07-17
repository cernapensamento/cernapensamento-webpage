import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  await page.goto('http://localhost:3000/login');
  await page.fill('#email', 'anxoperez@cernapensamento.org');
  await page.fill('#password', '123456');
  
  await Promise.all([
    page.waitForURL('**/escritorio*'),
    page.click('button[type="submit"]')
  ]);
  
  await page.waitForTimeout(2000);
  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a')).map(a => a.innerText + ': ' + a.href);
  });
  console.log("Links on dashboard:", links.join('\n'));
  
  await browser.close();
})();
