import { expect, test } from '@playwright/test';

import { signUp } from './support/auth';

// Needs the whole stack, auth on the emulator: `scripts/dev.sh`. A new account has no Pro, so
// these cover the upsell; the invite flow itself needs a Pro ranch (API tests cover it).

test('Administrar usuarios lists the owner and shows the Pro upsell', async ({ page }) => {
  await signUp(page);
  await page.goto('/config/usuarios');

  await expect(page.getByRole('heading', { name: 'Listado de Usuarios en Sistema' })).toBeVisible();
  await expect(page.getByText('Usuarios en sistema | 1')).toBeVisible();
  await expect(page.getByText('Dueño del rancho')).toBeVisible();
  await expect(page.getByText('Agregar usuarios es parte del plan Pro')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Agregar Usuario' })).toHaveCount(0);

  await page.goto('/config/usuarios/nuevo');
  await expect(page.getByRole('link', { name: 'Ver planes' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Crear Usuario' })).toHaveCount(0);
});

test('an unknown invite link says so', async ({ page }) => {
  await page.goto('/invitacion/no-such-token-0000000000000000');
  await expect(page.getByText('Este enlace no es válido. Pide una nueva invitación.')).toBeVisible();
});
