import { expect, type Page } from '@playwright/test';

export const PASSWORD = 'secreto123';

/** A fresh address per call, so specs never share an account on the emulator. */
export function freshEmail(): string {
  return `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

/** Signs up through the real form, against the Auth emulator, and waits for the first-cow step. */
export async function signUp(page: Page, email = freshEmail()): Promise<string> {
  await page.goto('/registro');
  await page.getByLabel('Nombre').fill('Ana Pérez');
  await page.getByRole('textbox', { name: 'Teléfono' }).fill('3334567890');
  await page.getByLabel('Correo electrónico').fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill(PASSWORD);
  await page.getByLabel('Confirmar contraseña').fill(PASSWORD);
  await page.getByRole('checkbox', { name: 'Acepto los Términos y condiciones' }).click();
  await page.getByRole('button', { name: /^(Crear Cuenta|Registrarme)$/ }).click();
  await expect(page).toHaveURL(/\/primera-vaca$/);
  return email;
}
