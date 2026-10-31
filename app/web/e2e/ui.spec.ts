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
  for (let i = 0; i < 400; i += 1) {
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

test('open dialogs and sheets have no axe violations and return focus', async ({ page }) => {
  await page.goto('/dev/ui');
  for (const [button, role] of [
    ['Abrir modal', 'dialog'],
    ['Abrir confirmación', 'alertdialog'],
    ['Abrir hoja inferior', 'dialog'],
  ] as const) {
    const trigger = page.getByRole('button', { name: button });
    await trigger.click();
    await expect(page.getByRole(role)).toBeVisible();
    const open = await new AxeBuilder({ page }).analyze();
    expect(open.violations.map((v) => `${v.id}: ${v.nodes[0]?.html}`)).toEqual([]);
    await page.keyboard.press('Escape');
    await expect(page.getByRole(role)).toHaveCount(0);
    await expect(trigger).toBeFocused();
  }
});

test('snackbars appear bottom-centre, clear contrast checks, and close', async ({ page }) => {
  await page.goto('/dev/ui');
  await page.getByRole('button', { name: 'Registrar celo' }).click();
  await page.getByRole('button', { name: 'Eliminar evento' }).click();
  await page.getByRole('button', { name: 'Simular falla' }).click();
  const error = page.getByRole('alert').filter({ hasText: 'Falla de conexión' });
  await expect(error).toBeVisible();
  const viewport = page.viewportSize();
  const box = await error.boundingBox();
  expect(Math.abs((box?.x ?? 0) + (box?.width ?? 0) / 2 - (viewport?.width ?? 0) / 2)).toBeLessThan(
    2,
  );
  expect((box?.y ?? 0) + (box?.height ?? 0)).toBeGreaterThan((viewport?.height ?? 0) - 40);
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.nodes[0]?.html}`)).toEqual([]);
  await error.getByRole('button', { name: 'Cerrar' }).click();
  await expect(error).toHaveCount(0);
});

test('table filters, sorts, pages and selects', async ({ page, isMobile }) => {
  await page.goto('/dev/ui');
  const table = page.getByRole('table', { name: 'Vacas' });
  await expect(table.getByRole('row')).toHaveCount(11);

  const raza = table.getByRole('columnheader', { name: 'Raza' });
  if (isMobile) await expect(raza).toBeHidden();
  else await expect(raza).toBeVisible();

  await table.getByRole('button', { name: 'ID Vaca' }).click();
  await table.getByRole('button', { name: 'ID Vaca' }).click();
  await expect(table.getByRole('row').nth(1)).toContainText('00023');

  await table.getByRole('checkbox', { name: 'Seleccionar los de esta página' }).click();
  await expect(page.getByTestId('table-state')).toContainText('Seleccionadas: 10');

  const pager = page.getByRole('navigation', { name: 'Paginación', exact: true });
  await pager.getByRole('button', { name: 'Ir a la página 3' }).click();
  await expect(table.getByRole('row')).toHaveCount(4);

  if (isMobile) {
    await page.getByRole('button', { name: 'Filtrar en móvil' }).click();
    const sheet = page.getByRole('dialog', { name: 'Filtros disponibles' });
    const apply = sheet.getByRole('button', { name: 'Aplicar filtro' });
    await expect(apply).toBeDisabled();
    await sheet.getByRole('radio', { name: 'Reproducción' }).click();
    await expect(sheet.getByRole('radio', { name: 'Vacía' })).toBeChecked();
    await sheet.getByRole('radio', { name: 'Sin animales (prueba)' }).click();
    await apply.click();
  } else {
    const panel = page.getByRole('group', { name: 'Filtros disponibles' });
    await expect(panel.getByRole('button', { name: 'Aplicar filtro' })).toBeDisabled();
    await panel.getByRole('combobox', { name: 'Categoría' }).click();
    await page.getByRole('option', { name: 'Reproducción' }).click();
    await panel.getByRole('combobox', { name: 'Variable' }).click();
    await page.getByRole('option', { name: 'Sin animales (prueba)' }).click();
    await panel.getByRole('button', { name: 'Aplicar filtro' }).click();
  }
  await expect(page.getByTestId('filter-value')).toHaveText(
    '{"category":"estado","variable":"Bajas"}',
  );
  await expect(table.getByText('No encontramos animales con el filtro aplicado')).toBeVisible();
  // Rows the filter hid cannot stay selected.
  await expect(page.getByTestId('table-state')).toContainText('Seleccionadas: 0');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.nodes[0]?.html}`)).toEqual([]);
});

test('wizard back with typed data asks before discarding', async ({ page }) => {
  await page.goto('/dev/ui');
  const wizard = page.getByTestId('wizard');
  await wizard.getByRole('textbox', { name: 'Nombre del potrero' }).fill('Secas');
  await wizard.getByRole('button', { name: 'Continuar' }).click();
  await expect(wizard.getByRole('heading', { name: 'Método de selección' })).toBeFocused();

  await wizard.getByRole('button', { name: 'Regresar' }).click();
  const dialog = page.getByRole('alertdialog', { name: '¿Descartar los cambios?' });
  await dialog.getByRole('button', { name: 'Seguir editando' }).click();
  await expect(wizard.getByRole('heading', { name: 'Método de selección' })).toBeVisible();

  await wizard.getByRole('button', { name: 'Regresar' }).click();
  await dialog.getByRole('button', { name: 'Sí, descartar' }).click();
  await expect(wizard.getByRole('heading', { name: 'Datos generales' })).toBeVisible();
  await expect(wizard.getByRole('textbox', { name: 'Nombre del potrero' })).toHaveValue('');
});
