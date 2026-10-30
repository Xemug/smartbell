import type { Config } from 'tailwindcss';

import { tailwindTheme, typeRamp, typeStyles } from './src/styles/designTokens';

// The theme comes from src/styles/tokens.json; the CSS variables it points at are in tokens.css.
// Colours, radii and shadows replace Tailwind's defaults so only token names are available.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  // tokens.css puts the type classes in the components layer; keep them all, since pages such as
  // /dev/tokens build their names at runtime.
  safelist: [...typeStyles.map((s) => `type-${s.name}`), ...typeRamp.map((r) => `ramp-${r.name}`)],
  theme: tailwindTheme(),
  plugins: [],
} satisfies Config;
