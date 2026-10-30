// Reads tokens.json (the single token source) and turns it into what the app consumes: the CSS
// custom properties and type classes in tokens.css (`npm run tokens`), the Tailwind theme, and
// the lists the /dev/tokens preview renders.
import source from './tokens.json';

type Json = Record<string, unknown>;

interface RawToken {
  $type: string;
  $value: unknown;
  $description?: string;
  $extensions?: { figma?: string; dark?: string };
}

export interface ColorToken {
  name: string;
  group: string;
  value: string;
  dark: string;
  figma?: string;
  description?: string;
}

export interface MoonAlias {
  name: string;
  color: string;
}

export type FontRole = 'display' | 'body';

export interface TypeStyle {
  name: string;
  figma: string;
  font: FontRole;
  fontWeight: number;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
}

export type Tier = 'sm' | 'md' | 'lg';

export interface RampRole {
  name: string;
  styles: Record<Tier, string>;
}

export interface Dimension {
  name: string;
  px: number;
  description?: string;
}

export interface Shadow {
  name: string;
  value: string;
  dark: string;
}

const tokens = source as unknown as Json;

function entries(group: unknown): [string, unknown][] {
  return Object.entries(group as Json).filter(([key]) => !key.startsWith('$'));
}

function isToken(node: unknown): node is RawToken {
  return typeof node === 'object' && node !== null && '$value' in node;
}

// Resolves a DTCG alias such as "{color.brand.primary}" to the referenced token's name, checking
// that the path exists and is a token of the expected type.
function aliasName(ref: unknown, type: string): string {
  const match = typeof ref === 'string' ? /^\{([^}]+)\}$/.exec(ref) : null;
  if (!match?.[1]) throw new Error(`Not a token alias: ${String(ref)}`);
  const path = match[1].split('.');
  let node: unknown = tokens;
  for (const key of path) node = (node as Json | undefined)?.[key];
  if (!isToken(node) || node.$type !== type) throw new Error(`Unknown ${type} token: ${ref}`);
  return path[path.length - 1] as string;
}

export const colors: ColorToken[] = entries(tokens.color).flatMap(([group, members]) =>
  entries(members).map(([name, node]) => {
    const token = node as RawToken;
    return {
      name,
      group,
      value: token.$value as string,
      dark: token.$extensions?.dark ?? (token.$value as string),
      figma: token.$extensions?.figma,
      description: token.$description,
    };
  }),
);

export const moonAliases: MoonAlias[] = entries(tokens.moon).map(([name, node]) => ({
  name,
  color: aliasName((node as RawToken).$value, 'color'),
}));

export const fonts = Object.fromEntries(
  entries(tokens.font).map(([name, node]) => [name, (node as RawToken).$value as string]),
) as Record<FontRole, string>;

export const typeStyles: TypeStyle[] = entries(tokens.typography).map(([name, node]) => {
  const token = node as RawToken;
  const value = token.$value as Omit<TypeStyle, 'name' | 'figma' | 'font'> & { fontFamily: string };
  return {
    name,
    figma: token.$extensions?.figma ?? name,
    font: aliasName(value.fontFamily, 'fontFamily') as FontRole,
    fontWeight: value.fontWeight,
    fontSize: value.fontSize,
    lineHeight: value.lineHeight,
    letterSpacing: value.letterSpacing,
  };
});

export const tiers: Tier[] = ['sm', 'md', 'lg'];

export const typeRamp: RampRole[] = entries(tokens.typeRamp).map(([name, node]) => {
  const styles = node as Record<Tier, string>;
  return {
    name,
    styles: {
      sm: aliasName(styles.sm, 'typography'),
      md: aliasName(styles.md, 'typography'),
      lg: aliasName(styles.lg, 'typography'),
    },
  };
});

function dimensions(group: unknown): Dimension[] {
  return entries(group).map(([name, node]) => {
    const token = node as RawToken;
    return { name, px: token.$value as number, description: token.$description };
  });
}

export const space = dimensions(tokens.space);
export const sizes = dimensions(tokens.size);
export const radii = dimensions(tokens.radius);
export const breakpoints = dimensions(tokens.breakpoint);

export const shadows: Shadow[] = entries(tokens.shadow).map(([name, node]) => {
  const token = node as RawToken;
  return { name, value: token.$value as string, dark: token.$extensions?.dark ?? '' };
});

export function breakpointPx(name: 'md' | 'lg' | 'xl'): number {
  const found = breakpoints.find((b) => b.name === name);
  if (!found) throw new Error(`Missing breakpoint ${name}`);
  return found.px;
}

// Opaque colours are stored as RGB channels ("20 96 170") so Tailwind can apply its opacity
// modifiers, as Moon expects; translucent ones are stored as a full rgb() value.
export function isOpaque(hex: string): boolean {
  return hex.length === 7;
}

export function hexToCss(hex: string): string {
  const match = /^#([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(hex);
  if (!match?.[1]) throw new Error(`Not a #RRGGBB(AA) colour: ${hex}`);
  const n = parseInt(match[1], 16);
  const channels = `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
  if (!match[2]) return channels;
  const alpha = Math.round((parseInt(match[2], 16) / 255) * 1000) / 1000;
  return `rgb(${channels} / ${alpha})`;
}

function colorByName(name: string): ColorToken {
  const found = colors.find((c) => c.name === name);
  if (!found) throw new Error(`Unknown colour ${name}`);
  return found;
}

// The CSS value to paint with a colour token, e.g. in an inline style.
export function cssColor(name: string): string {
  return isOpaque(colorByName(name).value) ? `rgb(var(--color-${name}))` : `var(--color-${name})`;
}

const rem = (px: number) => `${px / 16}rem`;

function typeDeclarations(styleName: string): string {
  const style = typeStyles.find((s) => s.name === styleName);
  if (!style) throw new Error(`Unknown type style ${styleName}`);
  return [
    `font-family: var(--font-${style.font});`,
    `font-weight: ${style.fontWeight};`,
    `font-size: ${rem(style.fontSize)};`,
    `line-height: ${rem(style.lineHeight)};`,
    `letter-spacing: ${style.letterSpacing}px;`,
  ].join(' ');
}

export function buildCss(): string {
  const vars = [
    ...colors.map((c) => `--color-${c.name}: ${hexToCss(c.value)};`),
    ...moonAliases.map((m) => `--${m.name}: var(--color-${m.color});`),
    ...Object.entries(fonts).map(([name, family]) => `--font-${name}: ${family};`),
    ...space.map((s) => `--space-${s.name}: ${s.px}px;`),
    ...sizes.map((s) => `--size-${s.name}: ${s.px}px;`),
    ...radii.map((r) => `--radius-${r.name}: ${r.px}px;`),
    ...shadows.map((s) => `--shadow-${s.name}: ${s.value};`),
    ...breakpoints.map((b) => `--breakpoint-${b.name}: ${b.px}px;`),
  ];
  const ramp = (tier: Tier) =>
    typeRamp.map((r) => `.ramp-${r.name} { ${typeDeclarations(r.styles[tier])} }`);
  const media = (bp: 'md' | 'lg', tier: Tier) => [
    `@media (min-width: ${breakpointPx(bp)}px) {`,
    ...ramp(tier).map((l) => `  ${l}`),
    '}',
  ];
  return [
    '/* Generated from tokens.json by `npm run tokens`. Do not edit by hand. */',
    '',
    ':root {',
    ...vars.map((v) => `  ${v}`),
    '}',
    '',
    '/* Type styles (UI Kit scale). */',
    ...typeStyles.map((s) => `.type-${s.name} { ${typeDeclarations(s.name)} }`),
    '',
    `/* Type ramp: responsive roles that switch at ${breakpointPx('md')} and ${breakpointPx('lg')}. */`,
    ...ramp('sm'),
    ...media('md', 'md'),
    ...media('lg', 'lg'),
    '',
  ].join('\n');
}

type Scale = Record<string, string>;

export interface TokenTheme {
  screens: Scale;
  colors: Scale;
  fontFamily: Scale;
  borderRadius: Scale;
  boxShadow: Scale;
  extend: { spacing: Scale; maxWidth: Scale };
}

export function tailwindTheme(): TokenTheme {
  const colorValue = (name: string, cssVar: string) =>
    isOpaque(colorByName(name).value) ? `rgb(var(${cssVar}) / <alpha-value>)` : `var(${cssVar})`;
  const px = (b: Dimension) => `${b.px}px`;
  return {
    screens: Object.fromEntries(breakpoints.map((b) => [b.name, px(b)])),
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      inherit: 'inherit',
      ...Object.fromEntries(colors.map((c) => [c.name, colorValue(c.name, `--color-${c.name}`)])),
      ...Object.fromEntries(moonAliases.map((m) => [m.name, colorValue(m.color, `--${m.name}`)])),
    },
    fontFamily: {
      sans: 'var(--font-body)',
      display: 'var(--font-display)',
      body: 'var(--font-body)',
    },
    borderRadius: {
      none: '0',
      interactive: 'var(--radius-i-sm)',
      surface: 'var(--radius-s-md)',
      full: 'var(--radius-full)',
      ...Object.fromEntries(
        radii
          .filter((r) => r.name !== 'full')
          .map((r) => [`moon-${r.name}`, `var(--radius-${r.name})`]),
      ),
    },
    boxShadow: {
      none: 'none',
      ...Object.fromEntries(shadows.map((s) => [`moon-${s.name}`, `var(--shadow-${s.name})`])),
    },
    extend: {
      spacing: {
        ...Object.fromEntries(space.map((s) => [s.name, `var(--space-${s.name})`])),
        ...Object.fromEntries(sizes.map((s) => [s.name, `var(--size-${s.name})`])),
      },
      maxWidth: { container: 'var(--size-container)' },
    },
  };
}
