import { expect, test } from '@playwright/test';

test('placeholder page shows the api health', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('api-health')).toHaveText('ok');
});
