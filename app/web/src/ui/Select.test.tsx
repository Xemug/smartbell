import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Select } from './Select';

const options = [
  { value: 'h', label: 'Holstein' },
  { value: 'j', label: 'Jersey' },
  { value: 'g', label: 'Gyr', disabled: true },
];

describe('Select', () => {
  it('shows the placeholder, then the chosen label', async () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <Select label="Raza" placeholder="Elige" options={options} value="" onChange={onChange} />,
    );
    const trigger = screen.getByRole('combobox', { name: 'Raza' });
    expect(trigger).toHaveTextContent('Elige');
    await userEvent.click(trigger);
    await userEvent.click(await screen.findByRole('option', { name: 'Jersey' }));
    expect(onChange).toHaveBeenCalledWith('j');
    rerender(<Select label="Raza" options={options} value="j" onChange={onChange} />);
    expect(screen.getByRole('combobox', { name: 'Raza' })).toHaveTextContent('Jersey');
  });

  it('opens and picks from the keyboard', async () => {
    const onChange = vi.fn();
    render(<Select label="Raza" options={options} value="" onChange={onChange} />);
    await userEvent.tab();
    expect(screen.getByRole('combobox')).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await screen.findByRole('listbox');
    await userEvent.keyboard('{ArrowDown}{Enter}');
    expect(onChange).toHaveBeenCalledWith('j');
  });

  it('reports errors and disabled options', async () => {
    render(<Select label="Raza" options={options} error="Elige una" />);
    const trigger = screen.getByRole('combobox', { name: 'Raza' });
    expect(trigger).toHaveAttribute('aria-invalid', 'true');
    expect(trigger).toHaveAccessibleDescription('Elige una');
    await userEvent.click(trigger);
    expect(await screen.findByRole('option', { name: 'Gyr' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });
});
