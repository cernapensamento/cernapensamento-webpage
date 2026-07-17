import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  page.on('console', msg => console.log(`[${msg.type()}] ${msg.text()}`));
  
  await page.goto('http://localhost:3000/login');
  await page.fill('#email', 'anxoperez@cernapensamento.org');
  await page.fill('#password', '123456');
  await Promise.all([
    page.waitForURL('**/escritorio*'),
    page.click('button[type="submit"]')
  ]);
  
  await page.goto('http://localhost:3000/');
  await page.waitForTimeout(1000);
  
  const result = await page.evaluate(async () => {
    // Try to get supabase from window if available, or just log
    return "Running in browser context";
  });
  
  console.log('Result:', result);
  await browser.close();
})();
