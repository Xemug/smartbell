/// <reference lib="dom" />
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

// Needs only the web server.
const nav = (page: Page) => page.getByRole('navigation', { name: 'Navegación principal' });

async function expectFakeDoor(page: Page, tab: string) {
  await nav(page).getByRole('button', { name: tab }).click();
  const dialog = page.getByRole('dialog', { name: 'Funcionalidad en construcción' });
  await expect(dialog).toBeVisible();
  const href = await dialog
    .getByRole('link', { name: 'Contactar en WhatsApp' })
    .getAttribute('href');
  expect(new URL(href ?? '').searchParams.get('text')).toBe(
    `Me interesa la funcionalidad ${tab}, quisiera conocer más acerca de la misma`,
  );
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
}

async function expectBuiltTabs(page: Page) {
  await nav(page).getByRole('link', { name: 'Vacas' }).click();
  await expect(page).toHaveURL(/\/vacas$/);
  await expect(page.getByRole('heading', { name: 'Vacas' })).toBeVisible();
  await nav(page).getByRole('link', { name: 'Tareas' }).click();
  await expect(page).toHaveURL(/\/$/);
}

test.describe('at 360px', () => {
  test.use({ viewport: { width: 360, height: 740 } });

  test('the bottom bar has the five tabs and each one works', async ({ page }) => {
    await page.goto('/');
    await expect(nav(page).locator('a, button')).toHaveText([
      'Tareas',
      'Vacas',
      'Grupos',
      'Reportes',
      'Ranchos',
    ]);
    await expectBuiltTabs(page);
    for (const tab of ['Grupos', 'Reportes', 'Ranchos']) await expectFakeDoor(page, tab);
  });

  test('Soporte in the avatar menu opens WhatsApp with the message', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Menú de cuenta/ }).click();
    const href = await page.getByRole('menuitem', { name: 'Soporte' }).getAttribute('href');
    expect(href).toBe(
      'https://wa.me/523334056398?text=Necesito%20que%20me%20ayuden%20a%20usar%20Smartbell.',
    );
  });

  test('has no horizontal scroll and no axe violations', async ({ page }) => {
    await page.goto('/vacas');
    await expect(page.getByRole('heading', { name: 'Vacas' })).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBe(0);
    const { violations } = await new AxeBuilder({ page }).analyze();
    expect(violations.map((v) => `${v.id}: ${v.nodes[0]?.html}`)).toEqual([]);
  });
});

test.describe('at 1280px', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('the web nav has the six items and each one works', async ({ page }) => {
    await page.goto('/');
    await expect(nav(page).locator('a, button')).toHaveText([
      'Tareas',
      'Vacas',
      'Grupos',
      'Reportes',
      'Usuarios',
      'Ranchos',
    ]);
    await expectBuiltTabs(page);
    for (const tab of ['Grupos', 'Reportes', 'Usuarios', 'Ranchos']) {
      await expectFakeDoor(page, tab);
    }
  });

  test('has no axe violations with the fake door open', async ({ page }) => {
    await page.goto('/vacas');
    await nav(page).getByRole('button', { name: 'Grupos' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    const { violations } = await new AxeBuilder({ page }).analyze();
    expect(violations.map((v) => `${v.id}: ${v.nodes[0]?.html}`)).toEqual([]);
  });
});
