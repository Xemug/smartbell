import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';

import { NumberField } from './NumberField';
import { TextArea } from './TextArea';
import { TextField } from './TextField';

describe('TextField', () => {
  it('ties the label and hint to the input', () => {
    render(<TextField label="Nombre" hint="Como en tu INE" />);
    const input = screen.getByRole('textbox', { name: 'Nombre' });
    expect(input).toHaveAccessibleDescription('Como en tu INE');
    expect(input).not.toHaveAttribute('aria-invalid');
  });

  it('shows the error instead of the hint and marks the input invalid', () => {
    render(<TextField label="Nombre" hint="Pista" error="Obligatorio" />);
    const input = screen.getByRole('textbox', { name: 'Nombre' });
    expect(input).toBeInvalid();
    expect(input).toHaveAccessibleDescription('Obligatorio');
    expect(screen.queryByText('Pista')).toBeNull();
  });

  it('still names the input with a floating label', () => {
    render(<TextField label="Rancho" floatingLabel />);
    expect(screen.getByRole('textbox', { name: 'Rancho' })).toBeInTheDocument();
  });

  it('reveals a password on demand', async () => {
    render(<TextField label="Clave" type="password" defaultValue="vaca" />);
    const input = screen.getByLabelText('Clave');
    expect(input).toHaveAttribute('type', 'password');
    await userEvent.click(screen.getByRole('button', { name: 'Mostrar contraseña' }));
    expect(input).toHaveAttribute('type', 'text');
  });

  it('disables the input', () => {
    render(<TextField label="Nombre" disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });
});

describe('TextArea', () => {
  it('only resizes when scaling', () => {
    render(<TextArea label="Notas" scaling />);
    expect(screen.getByRole('textbox', { name: 'Notas' })).toHaveClass('resize-y');
  });
});

describe('NumberField', () => {
  function Controlled({ decimals }: { decimals?: number }) {
    const [value, setValue] = useState('');
    return <NumberField label="Litros" decimals={decimals} value={value} onChange={setValue} />;
  }

  it('drops letters and asks for a numeric keyboard', async () => {
    render(<Controlled />);
    const input = screen.getByRole('textbox', { name: 'Litros' });
    await userEvent.type(input, '1a2b.3');
    expect(input).toHaveValue('123');
    expect(input).toHaveAttribute('inputmode', 'numeric');
  });

  it('allows the configured decimals', async () => {
    render(<Controlled decimals={1} />);
    const input = screen.getByRole('textbox');
    await userEvent.type(input, '12.55');
    expect(input).toHaveValue('12.5');
    expect(input).toHaveAttribute('inputmode', 'decimal');
  });
});
