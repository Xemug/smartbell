import { defineConfig, devices } from '@playwright/test';

// Runs against an already running stack (`scripts/dev.sh`); BASE_URL overrides the web address.
export default defineConfig({
  testDir: './e2e',
  use: { baseURL: process.env.BASE_URL ?? 'http://localhost:5173' },
  projects: [
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
  ],
});
