// @vitest-environment node
/// <reference types="node" />
import { readFileSync, readdirSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { buildIconModules, glyphExport, type IconKind } from './buildIconIndex';

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

describe('icon modules', () => {
  it('are up to date with the SVG files (run `npm run icons`)', () => {
    const { files, illustrations } = read();
    const modules = buildIconModules(files, illustrations);
    expect(readFileSync(dir('./glyphs.ts'), 'utf8')).toBe(modules.glyphs);
    expect(readFileSync(dir('./index.ts'), 'utf8')).toBe(modules.index);
  });

  it('keeps the gallery index apart from glyphs.ts, or every page would load the whole set', () => {
    const { files, illustrations } = read();
    expect(buildIconModules(files, illustrations).index).not.toContain("from './glyphs'");
  });

  it('names exports so reserved words stay valid', () => {
    expect(glyphExport('delete')).toBe('iconDelete');
    expect(glyphExport('chevron-down')).toBe('iconChevronDown');
  });

  it('does not let one name live in both kinds', () => {
    const names = read().files.map((f) => f.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('rejects a file that is not an svg', () => {
    expect(() => buildIconModules([{ name: 'bad', kind: 'line', svg: '<p/>' }], [])).toThrow('bad');
  });
});
