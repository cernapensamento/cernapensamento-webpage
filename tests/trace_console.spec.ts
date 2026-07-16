import { test, expect } from '@playwright/test';

test('trace login console', async ({ page }) => {
  const logs: string[] = [];
  page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
  
  await page.goto('http://localhost:3000/login');
  
  await page.fill('input[type="email"]', 'escritor@cernapensamento.org');
  await page.fill('input[type="password"]', '123456');
  
  const responsePromise = page.waitForResponse(response => response.url().includes('supabase'));
  
  await page.getByRole('button', { name: 'Ingresar' }).click();
  
  await responsePromise.catch(() => {});
  
  await page.waitForTimeout(3000);
  
  console.log('Console Logs:', logs.join('\n'));
});
