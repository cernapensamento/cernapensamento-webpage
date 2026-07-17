import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  await page.goto('http://localhost:3000/login');
  
  // Fill the login form
  await page.fill('#email', 'anxoperez@cernapensamento.org');
  await page.fill('#password', '123456');
  
  await Promise.all([
    page.waitForNavigation(),
    page.click('button[type="submit"]')
  ]);
  
  console.log('Logged in, URL:', page.url());
  
  // See if there's any error on screen
  const hasError = await page.evaluate(() => {
    const errEl = document.querySelector('[role="alert"]');
    return errEl ? errEl.innerText : null;
  });
  if (hasError) console.log("ERROR on screen:", hasError);
  
  await browser.close();
})();
