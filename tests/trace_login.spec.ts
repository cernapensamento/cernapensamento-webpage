import { test, expect } from '@playwright/test';

test('trace login', async ({ page }) => {
  await page.goto('http://localhost:3000/login');
  
  // Usar el correo correcto .com
  await page.fill('input[type="email"]', 'escritor@cerna.com');
  await page.fill('input[type="password"]', '123456');
  
  await page.screenshot({ path: 'scripts/login-before.png' });
  
  await page.getByRole('button', { name: 'Ingresar' }).click();
  
  // Wait a bit to see what happens
  await page.waitForTimeout(3000);
  
  await page.screenshot({ path: 'scripts/login-after.png' });
  console.log('Current URL after login:', page.url());
});
