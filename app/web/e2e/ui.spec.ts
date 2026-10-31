/// <reference lib="dom" />
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// Needs only the web server.
test('/dev/ui has no axe violations, closed or with a calendar open', async ({ page }) => {
  await page.goto('/dev/ui');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  const closed = await new AxeBuilder({ page }).analyze();
  expect(closed.violations.map((v) => `${v.id}: ${v.nodes[0]?.html}`)).toEqual([]);

  await page.getByRole('button', { name: 'Abrir calendario' }).first().click();
  await expect(page.getByRole('grid')).toBeVisible();
  const open = await new AxeBuilder({ page }).analyze();
  expect(open.violations.map((v) => `${v.id}: ${v.nodes[0]?.html}`)).toEqual([]);
});

test('every enabled control takes keyboard focus and shows a ring', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Tab order needs a keyboard');
  await page.goto('/dev/ui');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  const unringed: string[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < 200; i += 1) {
    await page.keyboard.press('Tab');
    const state = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      if (el === document.body) return null;
      const shadow = (node: Element | null) =>
        node ? getComputedStyle(node).boxShadow !== 'none' : false;
      return {
        id: el.id || el.outerHTML.slice(0, 80),
        // Text inputs paint the ring on their box.
        ringed: shadow(el) || shadow(el.closest('.focus-within\\:ring-2')),
      };
    });
    if (!state || seen.has(state.id)) continue;
    seen.add(state.id);
    if (!state.ringed) unringed.push(state.id);
  }
  expect(seen.size).toBeGreaterThan(50);
  expect(unringed).toEqual([]);
});

test('sample form rejects a future date and saves a valid form', async ({ page }) => {
  await page.goto('/dev/ui');
  const form = page.getByTestId('sample-form');
  await form.getByRole('button', { name: 'Guardar' }).click();
  await expect(form.getByText('Este campo es obligatorio').first()).toBeVisible();

  await form.getByRole('textbox', { name: 'Nombre del rancho' }).fill('La Rosa');
  await form.getByRole('textbox', { name: 'Teléfono' }).fill('44 2a1-23 4567');
  await expect(form.getByRole('textbox', { name: 'Teléfono' })).toHaveValue('4421234567');
  await form.getByRole('textbox', { name: 'Litros' }).fill('12.5');
  await form.getByRole('combobox', { name: 'Raza' }).click();
  await page.getByRole('option', { name: 'Jersey' }).click();
  await form.getByRole('checkbox', { name: 'Acepto los términos' }).click();

  const date = form.getByRole('textbox', { name: 'Fecha' });
  await date.fill('01012099');
  await expect(form.getByText('La fecha no puede ser futura')).toBeVisible();
  await form.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByTestId('saved')).toHaveCount(0);

  await date.fill('01012026');
  await form.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByTestId('saved')).toContainText('"phone":"+524421234567"');
  await expect(page.getByTestId('saved')).toContainText('"date":"2026-01-01"');
});

test('radio groups move with the arrow keys', async ({ page }) => {
  await page.goto('/dev/ui');
  await page.getByRole('radio', { name: 'Automático' }).first().focus();
  // Radix selects only while the key is held when focus lands, so a zero-length press would not.
  await page.keyboard.press('ArrowDown', { delay: 50 });
  await expect(page.getByRole('radio', { name: 'Manual' }).first()).toBeChecked();
});

test('date range picks two days from the keyboard', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Grid navigation needs a keyboard');
  await page.goto('/dev/ui');
  const trigger = page.getByRole('button', { name: /Periodo/ });
  await trigger.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('grid')).toBeVisible();
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('Enter');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('grid')).toHaveCount(0);
  await expect(trigger).toContainText('–');
});

test('nothing overflows the viewport', async ({ page }) => {
  await page.goto('/dev/ui');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
