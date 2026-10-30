import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import { VitePWA } from 'vite-plugin-pwa';

// The dev server proxies /api to the FastAPI app. API_URL overrides the target, e.g. when
// port 8000 is already taken.
const apiUrl = process.env.API_URL ?? 'http://localhost:8000';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      // Navigations to the api (same origin in production) must not get the cached SPA shell.
      workbox: { navigateFallbackDenylist: [/^\/api\//, /^\/openapi\.json$/, /^\/docs/] },
      manifest: {
        name: 'Smartbell',
        short_name: 'Smartbell',
        lang: 'es-MX',
        start_url: '/',
        display: 'standalone',
        theme_color: '#1460AA',
        background_color: '#F9F9F9',
        // Placeholder icons; the real set lands with the design tokens.
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
  server: {
    port: Number(process.env.WEB_PORT ?? 5173),
    strictPort: true,
    proxy: { '/api': apiUrl, '/openapi.json': apiUrl },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
