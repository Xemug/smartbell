// Regenerates src/styles/tokens.css from src/styles/tokens.json: `npm run tokens`.
import { writeFileSync } from 'node:fs';

import { buildCss } from '../src/styles/designTokens';

const out = new URL('../src/styles/tokens.css', import.meta.url);
writeFileSync(out, buildCss());
console.log(`wrote ${out.pathname}`);
