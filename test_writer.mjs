import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  await page.goto('http://localhost:3000/login');
  
  // Fill the login form
  await page.fill('input[name="email"]', 'escritor@cernapensamento.org');
  await page.fill('input[name="password"]', '123456');
  
  await Promise.all([
    page.waitForNavigation(),
    page.click('button[type="submit"]')
  ]);
  
  console.log('Logged in, URL:', page.url());
  
  // Go to homepage
  await page.goto('http://localhost:3000/');
  await page.waitForTimeout(2000);
  
  // Check if ESCRITORIO button exists
  const hasEscritorio = await page.evaluate(() => {
    return document.body.innerHTML.includes('ESCRITORIO');
  });
  
  console.log('Has ESCRITORIO button:', hasEscritorio);
  
  await browser.close();
})();
