const { test, expect } = require('@playwright/test');

test.describe('Authentication', () => {
  test('should allow a user to register', async ({ page }) => {
    // Navigate to the register page
    await page.goto('http://localhost:3000/register');
    
    // Fill out the registration form
    await page.fill('#email', `test${Date.now()}@example.com`);
    await page.fill('#password', 'password123');
    await page.fill('#confirm-password', 'password123');
    
    // Mock the API response for registration
    await page.route('**/api/auth/register', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          id: 1,
          email: 'test@example.com',
          is_active: true,
          membership_type: 'free'
        })
      });
    });
    
    // Mock the API response for token
    await page.route('**/api/auth/token', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          access_token: 'mock_token',
          token_type: 'bearer'
        })
      });
    });
    
    // Mock the API response for user profile
    await page.route('**/api/users/me', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          id: 1,
          email: 'test@example.com',
          is_active: true,
          membership_type: 'free'
        })
      });
    });
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Expect to be redirected to the onboarding page
    await expect(page).toHaveURL(/.*\/onboarding/);
  });
  
  test('should allow a user to login', async ({ page }) => {
    // Navigate to the login page
    await page.goto('http://localhost:3000/login');
    
    // Fill out the login form
    await page.fill('#email', 'test@example.com');
    await page.fill('#password', 'password123');
    
    // Mock the API response for token
    await page.route('**/api/auth/token', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          access_token: 'mock_token',
          token_type: 'bearer'
        })
      });
    });
    
    // Mock the API response for user profile
    await page.route('**/api/users/me', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          id: 1,
          email: 'test@example.com',
          is_active: true,
          membership_type: 'free'
        })
      });
    });
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Expect to be redirected to the dashboard
    await expect(page).toHaveURL(/.*\/dashboard/);
  });
  
  test('should display error message on login failure', async ({ page }) => {
    // Navigate to the login page
    await page.goto('http://localhost:3000/login');
    
    // Fill out the login form
    await page.fill('#email', 'test@example.com');
    await page.fill('#password', 'wrongpassword');
    
    // Mock the API response for token
    await page.route('**/api/auth/token', async route => {
      await route.fulfill({
        status: 401,
        body: JSON.stringify({
          detail: 'Incorrect email or password'
        })
      });
    });
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Expect error message to be displayed
    await expect(page.locator('.alert-error')).toBeVisible();
    await expect(page.locator('.alert-error')).toContainText('Failed to sign in');
    
    // Expect to stay on the login page
    await expect(page).toHaveURL(/.*\/login/);
  });
});
