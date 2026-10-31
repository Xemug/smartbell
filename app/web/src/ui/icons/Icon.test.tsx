import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Icon } from './Icon';
import { iconNames, icons } from './index';

describe('Icon', () => {
  it('renders a typed name at the default size, hidden from screen readers', () => {
    const { container } = render(<Icon name="bell" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
    expect(svg).toHaveAttribute('width', '24');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg?.querySelector('path')).not.toBeNull();
  });

  it('rejects an unknown name at compile time', () => {
    const unknown = () => (
      // @ts-expect-error `nope` is not an IconName; `tsc` fails if this ever type-checks.
      <Icon name="nope" />
    );
    expect(unknown).toBeTypeOf('function');
  });

  it('exposes an accessible name when given a title', () => {
    render(<Icon name="heat" title="Celo" />);
    expect(screen.getByRole('img', { name: 'Celo' })).toBeInTheDocument();
  });

  it('keeps the proportions of non-square icons', () => {
    const { container } = render(<Icon name="cow" size={30} />);
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

  it('has no ids that two different icons could share on one page', () => {
    const owners = new Map<string, string>();
    for (const name of iconNames)
      for (const [, id] of icons[name].body.matchAll(/ id="([^"]+)"/g)) {
        expect(owners.get(id as string) ?? name).toBe(name);
        owners.set(id as string, name);
      }
  });
});
