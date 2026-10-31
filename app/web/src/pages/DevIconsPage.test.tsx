import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { iconNames, icons, illustrationNames } from '../ui/icons/index';
import { DevIconsPage } from './DevIconsPage';

describe('DevIconsPage', () => {
  it('renders every icon and illustration', () => {
    render(<DevIconsPage />);
    expect(screen.getByRole('heading', { level: 1, name: 'Íconos' })).toBeInTheDocument();
    for (const name of iconNames)
      expect(screen.getAllByTestId(`icon-${name}`).length).toBeGreaterThan(0);
    for (const name of illustrationNames)
      expect(screen.getByAltText(name)).toHaveAttribute('src', `/illustrations/${name}.svg`);
  });

  it('shows line icons under two text colours', () => {
    render(<DevIconsPage />);
    const heat = screen.getByTestId('line-text-heat');
    expect(heat).toHaveClass('text-heat');
    const line = iconNames.filter((name) => icons[name].kind === 'line');
    expect(within(heat).getAllByRole('listitem')).toHaveLength(line.length);
  });
});
