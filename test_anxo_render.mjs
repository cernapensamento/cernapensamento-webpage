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
  
  console.log('Logged in, URL:', page.url());
  
  // See if there's any error on screen
  await page.waitForTimeout(2000);
  const html = await page.content();
  // find error div
  const errorAlert = await page.evaluate(() => {
    const errObj = document.querySelector('[role="alert"]');
    return errObj ? errObj.innerText : null;
  });
  console.log("Error Alert:", errorAlert);
  
  const h1 = await page.evaluate(() => {
    const h1 = document.querySelector('h1');
    return h1 ? h1.innerText : null;
  });
  console.log("H1 text:", h1);
  
  await browser.close();
})();
