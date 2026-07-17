import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  page.on('console', msg => console.log(`[${msg.type()}] ${msg.text()}`));
  page.on('request', request => {
    if (request.url().includes('supabase')) {
      console.log('>>', request.method(), request.url());
    }
  });
  page.on('response', response => {
    if (response.url().includes('supabase')) {
      console.log('<<', response.status(), response.url());
    }
  });
  
  await page.goto('http://localhost:3000/login');
  await page.fill('#email', 'anxoperez@cernapensamento.org');
  await page.fill('#password', '123456');
  await Promise.all([
    page.waitForURL('**/escritorio*'),
    page.click('button[type="submit"]')
  ]);
  
  await page.goto('http://localhost:3000/');
  await page.waitForTimeout(5000);
  
  await browser.close();
})();
