// @vitest-environment node
/// <reference types="node" />
import { readFileSync, readdirSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { buildIconIndex, type IconKind } from './buildIconIndex';

const dir = (path: string) => new URL(path, import.meta.url);
const svgFiles = (url: URL) => readdirSync(url).filter((f) => f.endsWith('.svg'));

function read() {
  const files = (['line', 'color'] as IconKind[]).flatMap((kind) =>
    svgFiles(dir(`./${kind}/`)).map((file) => ({
      name: file.slice(0, -4),
      kind,
      svg: readFileSync(dir(`./${kind}/${file}`), 'utf8'),
    })),
  );
  const illustrations = svgFiles(dir('../../../public/illustrations/')).map((f) => f.slice(0, -4));
  return { files, illustrations };
}

describe('icons index', () => {
  it('is up to date with the SVG files (run `npm run icons`)', () => {
    const { files, illustrations } = read();
    expect(readFileSync(dir('./index.ts'), 'utf8')).toBe(buildIconIndex(files, illustrations));
  });

  it('does not let one name live in both kinds', () => {
    const names = read().files.map((f) => f.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('rejects a file that is not an svg', () => {
    expect(() => buildIconIndex([{ name: 'bad', kind: 'line', svg: '<p/>' }], [])).toThrow('bad');
  });
});
