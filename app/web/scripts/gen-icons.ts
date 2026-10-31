// Regenerates src/ui/icons/index.ts from the SVG files: `npm run icons`.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';

import { buildIconIndex, type IconKind } from '../src/ui/icons/buildIconIndex';

const icons = new URL('../src/ui/icons/', import.meta.url);
const svgNames = (dir: URL) =>
  readdirSync(dir)
    .filter((f) => f.endsWith('.svg'))
    .map((f) => f.slice(0, -4));

const files = (['line', 'color'] as IconKind[]).flatMap((kind) => {
  const dir = new URL(`${kind}/`, icons);
  return svgNames(dir).map((name) => ({
    name,
    kind,
    svg: readFileSync(new URL(`${name}.svg`, dir), 'utf8'),
  }));
});
const illustrations = svgNames(new URL('../public/illustrations/', import.meta.url));

const out = new URL('index.ts', icons);
writeFileSync(out, buildIconIndex(files, illustrations));
console.log(`wrote ${out.pathname}`);
