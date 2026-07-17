import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  page.on('console', msg => console.log(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => console.log(`[PAGE_ERROR] ${err.message}`));
  
  // Login
  await page.goto('http://localhost:3000/login');
  await page.fill('#email', 'anxoperez@cernapensamento.org');
  await page.fill('#password', '123456');
  await Promise.all([
    page.waitForURL('**/escritorio*'),
    page.click('button[type="submit"]')
  ]);
  console.log('--- LOGGED IN');
  
  // Navigate to home
  await page.goto('http://localhost:3000/');
  
  // Wait and check states at intervals
  for (let i = 0; i < 5; i++) {
    await page.waitForTimeout(1000);
    const state = await page.evaluate(() => {
      const nav = document.querySelector('nav');
      if (!nav) return { nav: false };
      const html = nav.innerHTML;
      return {
        nav: true,
        hasAcceder: html.includes('Acceder'),
        hasSair: html.includes('Saír'),
        hasEscritorio: html.includes('ESCRITORIO'),
        hasThemeToggle: html.includes('dark_mode') || html.includes('light_mode'),
        buttonsCount: nav.querySelectorAll('button, a').length,
      };
    });
    console.log('t+' + (i+1) + 's:', JSON.stringify(state));
  }
  
  await browser.close();
})();
