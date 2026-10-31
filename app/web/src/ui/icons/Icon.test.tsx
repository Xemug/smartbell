import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { iconBell, iconCow, iconHeat, iconTrash } from './glyphs';
import { Icon } from './Icon';
import { iconNames, icons } from './index';

describe('Icon', () => {
  it('renders a typed name at the default size, hidden from screen readers', () => {
    const { container } = render(<Icon icon={iconBell} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
    expect(svg).toHaveAttribute('width', '24');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg?.querySelector('path')).not.toBeNull();
  });

  it('rejects anything but a glyph at compile time', () => {
    const unknown = () => (
      // @ts-expect-error A name is not a Glyph; `tsc` fails if this ever type-checks.
      <Icon icon="bell" />
    );
    expect(unknown).toBeTypeOf('function');
  });

  it('exposes an accessible name when given a title', () => {
    render(<Icon icon={iconHeat} title="Celo" />);
    expect(screen.getByRole('img', { name: 'Celo' })).toBeInTheDocument();
  });

  it('stays exposed when labelled with aria-label', () => {
    render(<Icon icon={iconTrash} aria-label="Borrar" />);
    expect(screen.getByLabelText('Borrar')).not.toHaveAttribute('aria-hidden');
  });

  it('gives each rendered copy of a masked icon its own ids', () => {
    const { container } = render(
      <>
        <Icon icon={iconHeat} />
        <Icon icon={iconHeat} />
      </>,
    );
    const ids = [...container.querySelectorAll('mask')].map((m) => m.id);
    expect(ids).toHaveLength(2);
    expect(ids[0]).not.toBe(ids[1]);
    const first = container.querySelector('svg');
    expect(first?.querySelector(`[mask="url(#${ids[0]})"]`)).not.toBeNull();
  });

  it('keeps the proportions of non-square icons', () => {
    const { container } = render(<Icon icon={iconCow} size={30} />);
    expect(container.querySelector('svg')).toHaveAttribute('width', '32');
  });
});

describe('icon set', () => {
  const line = iconNames.filter((name) => icons[name].kind === 'line');

  it('paints line icons with currentColor, not a fixed neutral', () => {
    for (const name of line) {
      expect(icons[name].body).toContain('currentColor');
      expect(icons[name].body).not.toMatch(/(fill|stroke)="(black|white|#F9FDFE|#979797)"/);
    }
  });

  it('keeps brand colours in colour icons', () => {
    expect(icons['disc-heat'].body).toContain('#EB004E');
    expect(icons['disc-heat'].body).not.toContain('currentColor');
  });

  it('only references ids defined in the same icon', () => {
    for (const name of iconNames) {
      const { body } = icons[name];
      const ids = [...body.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
      for (const [, ref] of body.matchAll(/url\(#([^)]+)\)/g)) expect(ids).toContain(ref);
    }
  });

  it('has no ids that two different icons could share on one page', () => {
    const owners = new Map<string, string>();
    for (const name of iconNames)
      for (const [, id] of icons[name].body.matchAll(/ id="([^"]+)"/g)) {
        expect(owners.get(id as string) ?? name).toBe(name);
        owners.set(id as string, name);
      }
  });
});
