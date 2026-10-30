import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { colors, typeRamp, typeStyles } from '../styles/designTokens';
import { DevTokensPage } from './DevTokensPage';

describe('DevTokensPage', () => {
  it('renders every colour with its value and Figma name', () => {
    render(<DevTokensPage />);
    expect(screen.getByRole('heading', { level: 1, name: 'Tokens de diseño' })).toBeInTheDocument();
    for (const c of colors) {
      const item = screen.getByTestId(`color-${c.name}`);
      expect(within(item).getByText(c.name)).toBeInTheDocument();
      expect(within(item).getByText(c.value)).toBeInTheDocument();
      if (c.figma) expect(within(item).getByText(`Figma: ${c.figma}`)).toBeInTheDocument();
    }
  });

  it('paints swatches through the CSS variables', () => {
    render(<DevTokensPage />);
    const swatch = screen.getByTestId('color-heat').querySelector('span');
    expect(swatch?.getAttribute('style')).toContain('var(--color-heat)');
  });

  it('renders every type style and ramp role with its class', () => {
    render(<DevTokensPage />);
    for (const s of typeStyles) {
      const item = screen.getByTestId(`type-${s.name}`);
      expect(item.querySelector(`.type-${s.name}`)).not.toBeNull();
    }
    for (const r of typeRamp)
      expect(screen.getByTestId(`ramp-${r.name}`)).toHaveClass(`ramp-${r.name}`);
  });

  it('lists the spacing, radius, shadow, breakpoint and Moon sections', () => {
    render(<DevTokensPage />);
    for (const name of [
      'Espaciado y tamaños',
      'Radios',
      'Sombras',
      'Puntos de quiebre',
      'Alias de Moon',
    ])
      expect(screen.getByRole('heading', { name })).toBeInTheDocument();
    expect(screen.getByText('piccolo')).toBeInTheDocument();
  });
});
