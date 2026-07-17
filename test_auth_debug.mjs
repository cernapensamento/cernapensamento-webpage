import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Capture ALL console logs
  page.on('console', msg => console.log(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => console.log(`[PAGE_ERROR] ${err.message}`));
  
  // Login first
  await page.goto('http://localhost:3000/login');
  await page.fill('#email', 'anxoperez@cernapensamento.org');
  await page.fill('#password', '123456');
  await Promise.all([
    page.waitForURL('**/escritorio*'),
    page.click('button[type="submit"]')
  ]);
  console.log('--- LOGGED IN, URL:', page.url());
  
  // Navigate to home
  await page.goto('http://localhost:3000/');
  await page.waitForTimeout(3000);
  
  // Check auth state
  const result = await page.evaluate(async () => {
    const nav = document.querySelector('nav');
    const html = nav ? nav.innerHTML : 'NO NAV FOUND';
    const hasAcceder = html.includes('Acceder');
    const hasSair = html.includes('Saír');
    const hasEscritorio = html.includes('ESCRITORIO');
    return { hasAcceder, hasSair, hasEscritorio, navSnippet: html.substring(0, 300) };
  });
  
  console.log('--- HOME PAGE AUTH STATE:');
  console.log('Has Acceder:', result.hasAcceder);
  console.log('Has Saír:', result.hasSair);
  console.log('Has ESCRITORIO:', result.hasEscritorio);
  
  // Now REFRESH (the key test)
  await page.reload();
  await page.waitForTimeout(3000);
  
  const resultAfterRefresh = await page.evaluate(async () => {
    const nav = document.querySelector('nav');
    const html = nav ? nav.innerHTML : 'NO NAV FOUND';
    const hasAcceder = html.includes('Acceder');
    const hasSair = html.includes('Saír');
    const hasEscritorio = html.includes('ESCRITORIO');
    return { hasAcceder, hasSair, hasEscritorio, navSnippet: html.substring(0, 300) };
  });
  
  console.log('--- AFTER REFRESH AUTH STATE:');
  console.log('Has Acceder:', resultAfterRefresh.hasAcceder);
  console.log('Has Saír:', resultAfterRefresh.hasSair);
  console.log('Has ESCRITORIO:', resultAfterRefresh.hasEscritorio);
  
  await browser.close();
})();
