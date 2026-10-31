import { expect, test } from '@playwright/test';

// Needs only the web server.
test('/dev/icons line icons follow the text colour', async ({ page }) => {
  await page.goto('/dev/icons');
  const bell = page.getByTestId('line-text-heat').getByTestId('icon-bell');
  await expect(bell).toBeVisible();
  await expect(bell).toHaveCSS('color', 'rgb(235, 0, 78)');
  await expect(bell.locator('path').first()).toHaveCSS('fill', 'rgb(235, 0, 78)');
});

test('/dev/icons loads every illustration file', async ({ page }) => {
  await page.goto('/dev/icons');
  const images = page.locator('main img');
  await expect(images.first()).toBeVisible();
  for (const image of await images.all()) {
    await expect
      .poll(() => image.evaluate((img) => (img as { naturalWidth?: number }).naturalWidth))
      .toBeGreaterThan(0);
  }
});
