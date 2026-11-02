import { expect, test } from '@playwright/test';

import { signUp } from './support/auth';

test('the home shows the api health, through an authenticated session', async ({ page }) => {
  await signUp(page);
  await page.goto('/');
  await expect(page.getByTestId('api-health')).toHaveText('ok');
});
