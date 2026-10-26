import { test, expect } from '@playwright/test';

test.describe('Contact Form Flow E2E', () => {
  test('displays client validation errors when submitting empty form', async ({ page }) => {
    await page.goto('/gl/contacto');

    const submitBtn = page.getByRole('button', { name: /enviar mensaxe/i });
    await submitBtn.click();

    await expect(page.getByText('O nome é obrigatorio')).toBeVisible();
    await expect(page.getByText('O correo é obrigatorio')).toBeVisible();
    await expect(page.getByText('Selecciona un asunto')).toBeVisible();
    await expect(page.getByText('A mensaxe é obrigatoria')).toBeVisible();
    await expect(page.getByText('Debes aceptar as condicións')).toBeVisible();
  });

  test('successfully submits contact proposal with intercepted API response', async ({ page }) => {
    // Intercept network call so NO real email is dispatched and NO quota is used
    await page.route('/api/contact', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, id: 'e2e_mock_id_999' }),
      });
    });

    await page.goto('/gl/contacto');

    // Fill form
    await page.getByLabel(/nome completo/i).fill('Rosalía E2E');
    await page.getByLabel(/^email/i).fill('rosalia.e2e@cerna.gal');
    await page.getByLabel(/asunto/i).selectOption({ label: 'Envío de Artigo' });
    await page.getByLabel(/mensaxe/i).fill('Proposta de ensaio para o consello editorial.');
    await page.getByLabel(/declaro que o contido é orixinal/i).check();

    // Attach mock PDF file
    await page.setInputFiles('input[type="file"]', {
      name: 'artigo-e2e.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4 mock content for e2e test'),
    });

    await expect(page.getByText('artigo-e2e.pdf')).toBeVisible();

    // Submit
    const submitBtn = page.getByRole('button', { name: /enviar mensaxe/i });
    await submitBtn.click();

    // Expect success state
    await expect(page.getByText('Mensaxe enviada con éxito.')).toBeVisible();
    await expect(page.getByRole('button', { name: /enviar outra mensaxe/i })).toBeVisible();
  });
});
