/// <reference lib="dom" />
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

import { freshEmail, PASSWORD, signUp } from './support/auth';

// Needs the whole stack, auth on the emulator: `scripts/dev.sh`.

async function logOut(page: Page) {
  await page.getByRole('button', { name: /Menú de cuenta/ }).click();
  await page.getByRole('menuitem', { name: 'Cerrar sesión' }).click();
  await expect(page).toHaveURL(/\/bienvenida$/);
}

async function logIn(page: Page, email: string, password = PASSWORD) {
  await page.goto('/entrar');
  await page.getByLabel('Correo electrónico').fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Ingresar' }).click();
}

test('sign-up lands on the first cow with "Mi rancho" made', async ({ page }) => {
  await signUp(page);
  await expect(page.getByRole('heading', { name: 'Registra tu primera vaca' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Mi rancho/ })).toBeVisible();
});

test('log out, then log back in to the same account', async ({ page }) => {
  const email = await signUp(page);
  await logOut(page);

  await logIn(page, email, 'equivocada');
  await expect(page.getByRole('alert')).toHaveText('El correo o la contraseña no son correctos');

  await logIn(page, email);
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('button', { name: /Mi rancho/ })).toBeVisible();
});

test('the app is closed to signed-out visitors', async ({ page }) => {
  await page.goto('/vacas');
  await expect(page).toHaveURL(/\/bienvenida$/);
  await expect(page.getByRole('link', { name: 'Crear Cuenta' })).toBeVisible();
});

test('the API rejects calls without a valid token', async ({ request }) => {
  expect((await request.get('/api/auth/me')).status()).toBe(401);
  const forged = await request.get('/api/auth/me', {
    headers: { Authorization: 'Bearer eyJhbGciOiJub25lIn0.eyJzdWIiOiJ4In0.' },
  });
  expect(forged.status()).toBe(401);
});

test('forgot password confirms without saying whether the account exists', async ({ page }) => {
  await page.goto('/recuperar');
  await page.getByLabel('Correo electrónico').fill(freshEmail());
  await page.getByRole('button', { name: 'Enviar enlace' }).click();
  await expect(page.getByText(/te enviamos un enlace/)).toBeVisible();
});

for (const path of ['/bienvenida', '/entrar', '/registro', '/recuperar']) {
  test(`${path} has no axe violations or horizontal scroll`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator('main')).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBe(0);
    const { violations } = await new AxeBuilder({ page }).analyze();
    expect(violations.map((v) => `${v.id}: ${v.nodes[0]?.html}`)).toEqual([]);
  });
}
