import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { PhoneField } from './PhoneField';

function Controlled({
  onChange,
  initial = '',
}: {
  onChange?: (v: string) => void;
  initial?: string;
}) {
  const [value, setValue] = useState(initial);
  return (
    <PhoneField
      label="Teléfono"
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
    />
  );
}

const number = () => screen.getByRole('textbox', { name: 'Teléfono' });
const dial = () => screen.getByRole('combobox', { name: 'Código de país' });

describe('PhoneField', () => {
  it('defaults to +52 and emits nothing until digits are typed', () => {
    render(<Controlled />);
    expect(dial()).toHaveTextContent('+52');
    expect(number()).toHaveValue('');
  });

  it('strips everything but digits and joins the code', async () => {
    const onChange = vi.fn();
    render(<Controlled onChange={onChange} />);
    await userEvent.type(number(), '44a2-1');
    expect(number()).toHaveValue('4421');
    expect(onChange).toHaveBeenLastCalledWith('+524421');
  });

  it('takes the code from a pasted international number', async () => {
    const onChange = vi.fn();
    render(<Controlled onChange={onChange} />);
    await userEvent.click(number());
    await userEvent.paste('+1 (555) 123-4567');
    expect(onChange).toHaveBeenLastCalledWith('+15551234567');
    expect(dial()).toHaveTextContent('+1');
    expect(number()).toHaveValue('5551234567');
  });

  it('prefers the longest matching code', () => {
    render(<Controlled initial="+5025551234" />);
    expect(dial()).toHaveTextContent('+502');
    expect(number()).toHaveValue('5551234');
  });

  it('keeps an unlisted code in the number rather than losing it', async () => {
    const onChange = vi.fn();
    render(<Controlled onChange={onChange} />);
    await userEvent.click(number());
    await userEvent.paste('+81 90 1234');
    expect(onChange).toHaveBeenLastCalledWith('+81901234');
    expect(number()).toHaveValue('+81901234');
  });

  it('keeps a loaded code when the number is cleared', async () => {
    render(<Controlled initial="+34611222333" />);
    await userEvent.clear(number());
    expect(dial()).toHaveTextContent('+34');
  });

  it('stays well formed when a code replaces an unlisted one', async () => {
    const onChange = vi.fn();
    render(<Controlled initial="+4915112345" onChange={onChange} />);
    await userEvent.click(dial());
    await userEvent.click(await screen.findByRole('option', { name: /\+57/ }));
    expect(onChange).toHaveBeenLastCalledWith('+574915112345');
  });

  it('changes the code of a typed number', async () => {
    const onChange = vi.fn();
    render(<Controlled initial="+524421234567" onChange={onChange} />);
    await userEvent.click(dial());
    await userEvent.click(await screen.findByRole('option', { name: /\+57/ }));
    expect(onChange).toHaveBeenLastCalledWith('+574421234567');
  });
});
