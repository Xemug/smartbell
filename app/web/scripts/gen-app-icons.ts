// Renders the PNG install icons from the master mark, public/favicon.svg: `npm run app-icons`.
// The mark redraws the store listing's icon (legacy assets/images/app_launcher_icon.png). Its
// ring sits inside the maskable safe zone, so icon-512.png doubles as the maskable icon.
import { readFileSync } from 'node:fs';

import { chromium } from '@playwright/test';

const pub = new URL('../public/', import.meta.url);
const svg = readFileSync(new URL('favicon.svg', pub), 'utf8');
const sizes: Record<string, number> = {
  'icon-192.png': 192,
  'icon-512.png': 512,
  'apple-touch-icon.png': 180,
};

const browser = await chromium.launch();
for (const [file, size] of Object.entries(sizes)) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  const src = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  await page.setContent(
    `<body style="margin:0"><img src="${src}" width="${size}" height="${size}" style="display:block"></body>`,
  );
  await page.locator('img').evaluate((img: HTMLImageElement) => img.decode());
  await page.screenshot({ path: new URL(file, pub).pathname });
  await page.close();
  console.log(`wrote public/${file} (${size}px)`);
}
await browser.close();
