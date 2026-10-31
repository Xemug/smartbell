import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { iconCow } from './icons/glyphs';
import { SplitIndicator } from './SplitIndicator';

describe('SplitIndicator', () => {
  it('shows the label and a zero-padded count', () => {
    render(<SplitIndicator label="Vacas en Sistema" count={8} />);
    expect(screen.getByText('Vacas en Sistema')).toBeInTheDocument();
    expect(screen.getByText('008')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Vacas en Sistema: 008' })).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('does not cut counts above three digits', () => {
    render(<SplitIndicator label="Vacas" count={1234} />);
    expect(screen.getByText('1234')).toBeInTheDocument();
  });

  it('keeps the label as the name when an icon replaces it', () => {
    render(<SplitIndicator label="Vacas" icon={iconCow} count={8} />);
    expect(screen.queryByText('Vacas')).toBeNull();
    expect(screen.getByRole('group', { name: 'Vacas: 008' })).toBeInTheDocument();
  });

  it('toggles as a pressed button, activated or deactivated', async () => {
    const onClick = vi.fn();
    render(
      <SplitIndicator label="Vacas" icon={iconCow} count={8} active={false} onClick={onClick} />,
    );
    const button = screen.getByRole('button', { name: 'Vacas: 008' });
    expect(button).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });
});
