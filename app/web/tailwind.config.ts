import type { Config } from 'tailwindcss';

import { tailwindTheme } from './src/styles/designTokens';

// The theme comes from src/styles/tokens.json; the CSS variables it points at are in tokens.css.
// Colours, radii and shadows replace Tailwind's defaults so only token names are available.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: tailwindTheme(),
  plugins: [],
} satisfies Config;
