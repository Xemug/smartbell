import { render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { describe, expect, it } from 'vitest';

import { DevUiPage } from './DevUiPage';

describe('DevUiPage', () => {
  it('shows one of each control', () => {
    render(<DevUiPage />);
    expect(screen.getByRole('heading', { level: 1, name: 'Componentes base' })).toBeInTheDocument();
    for (const role of ['button', 'textbox', 'combobox', 'checkbox', 'radio', 'switch'])
      expect(screen.getAllByRole(role).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('progressbar').length).toBeGreaterThan(0);
  });

  it('has no axe violations (contrast is covered by e2e/ui.spec.ts in a real browser)', async () => {
    const { container } = render(<DevUiPage />);
    const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(results.violations.map((v) => `${v.id}: ${v.nodes[0]?.html}`)).toEqual([]);
  });
});
