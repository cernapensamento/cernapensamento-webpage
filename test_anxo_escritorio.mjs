import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  await page.goto('http://localhost:3000/login');
  await page.fill('#email', 'anxoperez@cernapensamento.org');
  await page.fill('#password', '123456');
  
  await Promise.all([
    page.waitForNavigation(),
    page.click('button[type="submit"]')
  ]);
  
  console.log('Logged in, URL:', page.url());
  
  // See if there's any error on screen
  await page.waitForTimeout(2000);
  const html = await page.content();
  if (html.includes('Error') || html.includes('404')) {
    console.log("Error found in HTML!");
    console.log(html.substring(0, 500));
  } else {
    console.log("Page rendered fine.");
  }
  
  await browser.close();
})();
