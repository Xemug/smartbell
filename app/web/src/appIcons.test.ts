// @vitest-environment node
/// <reference types="node" />
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const file = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url));

// A PNG's width and height are the two big-endian words after the IHDR tag.
const pngSize = (png: Buffer) => [png.readUInt32BE(16), png.readUInt32BE(20)];

describe('app icons', () => {
  it.each([
    ['icon-192.png', 192],
    ['icon-512.png', 512],
    ['apple-touch-icon.png', 180],
  ])('public/%s is a %ipx square PNG', (name, size) => {
    const png = file(`public/${name}`);
    expect(png.subarray(1, 4).toString()).toBe('PNG');
    expect(pngSize(png)).toEqual([size, size]);
  });

  it('the favicon is the Smartbell mark, not the scaffold placeholder', () => {
    const svg = file('public/favicon.svg').toString();
    expect(svg).toContain('fill="#063664"');
    expect(svg).not.toContain('<text');
  });

  it('index.html links the favicon and the apple-touch icon', () => {
    const html = file('index.html').toString();
    expect(html).toContain('href="/favicon.svg"');
    expect(html).toContain('<link rel="apple-touch-icon" href="/apple-touch-icon.png" />');
  });
});
