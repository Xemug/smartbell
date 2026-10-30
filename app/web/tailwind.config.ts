import type { Config } from 'tailwindcss';

// Moon's Tailwind preset is added by the design-tokens card.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
} satisfies Config;
