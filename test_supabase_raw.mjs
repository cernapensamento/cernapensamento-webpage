import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
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
  console.log('--- LOGGED IN');
  
  // Go to homepage
  await page.goto('http://localhost:3000/');
  await page.waitForTimeout(1000);
  
  // Check raw cookies
  const cookies = await context.cookies();
  const sbCookies = cookies.filter(c => c.name.includes('sb-') || c.name.includes('supabase'));
  console.log('--- Supabase cookies:', sbCookies.map(c => `${c.name}=${c.value.substring(0, 30)}...`).join('\n'));
  
  // Try running supabase directly in browser
  const result = await page.evaluate(async () => {
    const keys = Object.keys(localStorage);
    const sbKeys = keys.filter(k => k.includes('sb-') || k.includes('supabase') || k.includes('auth'));
    const sbData = {};
    sbKeys.forEach(k => sbData[k] = localStorage.getItem(k)?.substring(0, 100) || '');
    
    return { 
      localStorageKeys: sbKeys,
      sbData,
      allKeys: keys
    };
  });
  
  console.log('--- localStorage auth keys:', JSON.stringify(result.localStorageKeys));
  console.log('--- All localStorage keys:', JSON.stringify(result.allKeys));
  console.log('--- sb data:', JSON.stringify(result.sbData));
  
  await browser.close();
})();
