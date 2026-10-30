// @vitest-environment node
/// <reference types="node" />
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import {
  breakpoints,
  buildCss,
  colors,
  cssColor,
  hexToCss,
  moonAliases,
  radii,
  shadows,
  space,
  tailwindTheme,
  typeRamp,
  typeStyles,
} from './designTokens';

// The UI Kit's variables (docs/design-inventory/uikit-design-system.md §1.1), light mode. The
// alpha tints are re-derived from their semantic colours (§4.1 step 4), so only their names are
// checked here.
const kitColors: Record<string, string> = {
  'Brand Colors/Primary': '#1460AA',
  'Brand Colors/Secondary': '#57A7F5',
  'Brand Colors/Tertiary': '#BAE5FD',
  'Brand Colors/Alternate': '#65D9AC',
  'Neutral 1': '#FFFFFF',
  'Neutral 2': '#E2E2E2',
  'Neutral 3': '#757B84',
  'Neutral 4': '#000000',
  'Primary-background': '#F9F9F9',
  'Secondary-background': '#EBEBEB',
  'Primary-text': '#333333',
  'Secondary-text': '#666666',
  Info: '#57A7F5',
  Warning: '#FEC011',
  Error: '#EB004E',
  Success: '#369A73',
  'Button-text': '#FFFFFF',
  Opacity: '#2A2A2A1A',
  Scrim: '#0000008F',
};
const kitTints = ['Primary', 'Info', 'Warning', 'Error', 'Success'].flatMap((c) => [
  `${c}-60`,
  `${c}-10`,
]);

// §1.2: [size, line height, weight, letter spacing]
const kitType: Record<string, [number, number, number, number]> = {
  'Display Large': [56, 64, 700, -1.5],
  'Display Medium': [48, 56, 700, -1],
  'Display Small': [40, 48, 700, -0.5],
  'Headline Large': [32, 40, 700, -0.5],
  'Headline Medium': [24, 32, 600, 0],
  'Headline Small': [24, 32, 700, 0],
  'Title Large': [20, 32, 600, 0],
  'Title Medium': [18, 28, 600, 0],
  'Title Small': [16, 24, 600, 0],
  'Label Large': [16, 24, 600, 0],
  'Label Medium': [14, 22, 600, 0],
  'Label Small': [12, 18, 600, 0],
  'Body Large': [16, 24, 400, -0.5],
  'Body Medium': [14, 22, 400, 0],
  'Body Small': [12, 18, 400, 0],
};

const byName = <T extends { name: string }>(list: T[], name: string) =>
  list.find((item) => item.name === name);

describe('tokens.json', () => {
  it.each(Object.entries(kitColors))('has the kit colour %s = %s', (figma, hex) => {
    const token = colors.find((c) => c.figma === figma);
    expect(token).toBeDefined();
    expect(token?.value).toBe(hex);
  });

  it.each(kitTints)('has the kit tint %s, derived from its semantic colour', (figma) => {
    const token = colors.find((c) => c.figma === figma);
    expect(token?.value).toMatch(/^#[0-9A-F]{8}$/);
    const base = figma.startsWith('Primary') ? 'primary-dark' : figma.split('-')[0]?.toLowerCase();
    expect(token?.value.slice(0, 7)).toBe(byName(colors, base ?? '')?.value);
  });

  it('has the domain tokens the kit dropped', () => {
    expect(byName(colors, 'heat')?.value).toBe('#EB004E');
    expect(byName(colors, 'warning-orange')?.value).toBe('#FF7B01');
    expect(byName(colors, 'primary-dark')?.value).toBe('#063664');
    expect(byName(colors, 'success-light')?.value).toBe('#97F6D2');
  });

  it('keeps a dark value for every colour (structure only, not shipped in v1)', () => {
    for (const c of colors) expect(c.dark, c.name).toMatch(/^#[0-9A-F]{6}([0-9A-F]{2})?$/);
    expect(byName(colors, 'primary-background')?.dark).toBe('#121212');
  });

  it('gives every colour a unique kebab-case semantic name', () => {
    const names = colors.map((c) => c.name);
    expect(new Set(names).size).toBe(names.length);
    for (const name of names) expect(name).toMatch(/^[a-z]+(-[a-z0-9]+)*$/);
  });

  it.each(Object.entries(kitType))('has the kit type style %s', (figma, expected) => {
    const style = typeStyles.find((s) => s.figma === figma);
    expect(style).toBeDefined();
    const [size, lineHeight, weight, tracking] = expected;
    expect(style).toMatchObject({
      fontSize: size,
      lineHeight,
      fontWeight: weight,
      letterSpacing: tracking,
      font: /^(Display|Headline|Title)/.test(figma) ? 'display' : 'body',
    });
  });

  it('has the kit spacing, radii and shadows', () => {
    expect(space.map((s) => s.px)).toEqual([0, 4, 8, 12, 16, 20, 24, 32, 40, 48]);
    expect(Object.fromEntries(radii.map((r) => [r.name, r.px]))).toMatchObject({
      'i-xs': 4,
      'i-sm': 8,
      'i-md': 12,
      's-xs': 4,
      's-sm': 8,
      's-md': 12,
      's-lg': 16,
    });
    expect(shadows.map((s) => s.name)).toEqual(['sm', 'md', 'lg', 'xl']);
    expect(byName(shadows, 'sm')?.value).toBe('0 0 1px #00000066, 0 6px 6px -6px #00000029');
  });

  it('uses the 600 / 960 / 1280 breakpoints', () => {
    expect(breakpoints.map((b) => [b.name, b.px])).toEqual([
      ['md', 600],
      ['lg', 960],
      ['xl', 1280],
    ]);
  });

  it('maps the Moon aliases to the Smartbell colours', () => {
    expect(Object.fromEntries(moonAliases.map((m) => [m.name, m.color]))).toEqual({
      piccolo: 'primary',
      hit: 'alternate',
      goku: 'primary-background',
      gohan: 'neutral-1',
      goten: 'button-text',
      beerus: 'neutral-2',
      bulma: 'primary-text',
      trunks: 'secondary-text',
      chichi: 'error',
      krillin: 'warning',
      roshi: 'success',
      whis: 'info',
    });
  });

  it('keeps body at 16 px at every tier', () => {
    const body = byName(typeRamp, 'body');
    for (const style of Object.values(body?.styles ?? {}))
      expect(byName(typeStyles, style)?.fontSize).toBe(16);
  });
});

describe('tokens.css', () => {
  // Read from disk: a `?raw` import of a .css file comes back empty under vitest.
  const generatedCss = readFileSync(new URL('./tokens.css', import.meta.url), 'utf8');

  it('is up to date with tokens.json (run `npm run tokens`)', () => {
    expect(generatedCss).toBe(buildCss());
  });

  it('declares every colour, Moon alias, radius and shadow as a variable', () => {
    for (const c of colors)
      expect(generatedCss).toContain(`--color-${c.name}: ${hexToCss(c.value)};`);
    for (const m of moonAliases)
      expect(generatedCss).toContain(`--${m.name}: var(--color-${m.color});`);
    expect(generatedCss).toContain('--piccolo: var(--color-primary);');
    expect(generatedCss).toContain('--radius-i-sm: 8px;');
    expect(generatedCss).toContain('--shadow-md: 0 0 1px #00000033, 0 12px 12px -6px #00000029;');
  });

  it('switches the type ramp at 600 and 960', () => {
    const [mobile, tablet, desktop] = generatedCss.split(/@media \(min-width: (?:600|960)px\)/);
    expect(generatedCss).toMatch(/@media \(min-width: 600px\)[\s\S]*@media \(min-width: 960px\)/);
    expect(mobile).toMatch(/\.ramp-kpi \{[^}]*font-size: 1\.5rem;/);
    expect(tablet).toMatch(/\.ramp-kpi \{[^}]*font-size: 2\.5rem;/);
    expect(desktop).toMatch(/\.ramp-kpi \{[^}]*font-size: 3rem;/);
  });
});

describe('colour helpers', () => {
  it('turns hex into RGB channels, or rgb() with alpha', () => {
    expect(hexToCss('#1460AA')).toBe('20 96 170');
    expect(hexToCss('#0000008F')).toBe('rgb(0 0 0 / 0.561)');
    expect(() => hexToCss('red')).toThrow();
  });

  it('paints opaque and translucent colours from their variables', () => {
    expect(cssColor('primary')).toBe('rgb(var(--color-primary))');
    expect(cssColor('scrim')).toBe('var(--color-scrim)');
  });
});

describe('tailwindTheme', () => {
  const theme = tailwindTheme();

  it('exposes token names, not hex values', () => {
    expect(theme.colors.primary).toBe('rgb(var(--color-primary) / <alpha-value>)');
    expect(theme.colors.heat).toBe('rgb(var(--color-heat) / <alpha-value>)');
    expect(theme.colors.piccolo).toBe('rgb(var(--piccolo) / <alpha-value>)');
    expect(theme.colors.scrim).toBe('var(--color-scrim)');
    expect(theme.borderRadius.interactive).toBe('var(--radius-i-sm)');
    expect(theme.borderRadius.surface).toBe('var(--radius-s-md)');
    expect(theme.boxShadow['moon-md']).toBe('var(--shadow-md)');
  });

  it('uses the token breakpoints as screens', () => {
    expect(theme.screens).toEqual({ md: '600px', lg: '960px', xl: '1280px' });
  });
});
