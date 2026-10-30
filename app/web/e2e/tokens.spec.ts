import { expect, test } from '@playwright/test';

// The type ramp switches at the 600 and 960 breakpoints; needs only the web server.
const tiers = [
  { width: 375, tier: 'sm', kpi: '24px', pageTitle: '24px' },
  { width: 599, tier: 'sm', kpi: '24px', pageTitle: '24px' },
  { width: 600, tier: 'md', kpi: '40px', pageTitle: '32px' },
  { width: 959, tier: 'md', kpi: '40px', pageTitle: '32px' },
  { width: 960, tier: 'lg', kpi: '48px', pageTitle: '40px' },
];

for (const { width, tier, kpi, pageTitle } of tiers) {
  test(`/dev/tokens uses the ${tier} ramp at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/dev/tokens');
    await expect(page.getByTestId('current-tier').getByText(tier, { exact: true })).toBeVisible();
    await expect(page.getByTestId('ramp-kpi')).toHaveCSS('font-size', kpi);
    await expect(page.getByTestId('ramp-page-title')).toHaveCSS('font-size', pageTitle);
    await expect(page.getByTestId('ramp-body')).toHaveCSS('font-size', '16px');
  });
}

test('/dev/tokens paints tokens from the generated variables', async ({ page }) => {
  await page.goto('/dev/tokens');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(249, 249, 249)');
  await expect(page.getByRole('heading', { level: 1 })).toHaveCSS('font-family', /Montserrat/);
  const heat = page.getByTestId('color-heat').locator('span').first();
  await expect(heat).toHaveCSS('background-color', 'rgb(235, 0, 78)');
});
