import { test, expect } from '@playwright/test';

test.describe('Protección de rutas por Rol', () => {
  const randomEmail = `test_${Date.now()}@example.com`;
  const password = 'Password123!';

  test('Un lector (rol usuario) no puede acceder a /escritorio y es redirigido a /escritorio/perfil', async ({ page }) => {
    // 1. Registro (Crea un nuevo usuario que por defecto tiene rol 'usuario')
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /solicita acceso/i }).click();
    await page.fill('input[type="email"]', randomEmail);
    await page.fill('input[type="password"]', password);
    
    // Manejar el alert de registro exitoso (si existe)
    page.on('dialog', dialog => dialog.accept());
    
    await page.getByRole('button', { name: 'Registrarse' }).click();

    // 2. Iniciar sesión con el nuevo usuario
    await page.fill('input[type="email"]', randomEmail);
    await page.fill('input[type="password"]', password);
    await page.getByRole('button', { name: 'Ingresar' }).click();

    // 3. El sistema redirige automáticamente al layout de escritorio
    // Como es lector (usuario), el layout de escritorio (page.tsx) lo empuja a su perfil
    await page.waitForURL(/.*\/escritorio\/perfil/);
    await expect(page).toHaveURL(/.*\/escritorio\/perfil/);
  });

  test('Un escritor (rol escritor) puede acceder al escritorio y ver el editor', async ({ page }) => {
    // 1. Iniciar sesión con el escritor de prueba (ya creado en la BD por seed_roles.sql)
    await page.goto('/login');
    await page.fill('input[type="email"]', 'escritor@cernapensamento.org');
    await page.fill('input[type="password"]', '123456');
    await page.getByRole('button', { name: 'Ingresar' }).click();

    // Debería ser redirigido directamente a /escritorio según la lógica de login
    await page.waitForURL(/.*\/escritorio/);
    await expect(page).toHaveURL(/.*\/escritorio/);

    // 2. Intentar acceder al editor nuevo
    await page.goto('/escritorio/nuevo');
    await expect(page).toHaveURL(/.*\/escritorio\/nuevo/);
    
    // Validar que el botón de publicar está presente (el editor cargó)
    await expect(page.getByRole('button', { name: 'Publicar', exact: true })).toBeVisible();
  });
});
