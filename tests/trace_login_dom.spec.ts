import { test, expect } from '@playwright/test';

test('trace login DOM', async ({ page }) => {
  await page.goto('http://localhost:3000/login');
  
  await page.fill('input[type="email"]', 'escritor@cerna.com');
  await page.fill('input[type="password"]', '123456');
  await page.getByRole('button', { name: 'Ingresar' }).click();
  
  await page.waitForTimeout(3000);
  
  const html = await page.content();
  console.log('HTML after login:', html);
});
