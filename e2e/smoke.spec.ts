import { test, expect } from '@playwright/test';

test.describe('Smoke & Navigation E2E', () => {
  test('redirects root / to default locale and renders header navigation', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/gl/);

    // Header nav links exist
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
    await expect(page.locator('text=Cerna').first()).toBeVisible();
  });

  test('switches language from Galego to Español', async ({ page }) => {
    await page.goto('/gl');

    // Language toggle shows GL
    const toggle = page.getByRole('button', { name: /cambiar a castellano/i });
    await expect(toggle).toBeVisible();

    await toggle.click();
    await expect(page).toHaveURL(/\/es/);
  });
});
