import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DateField } from './DateField';
import { DateRangeField, type IsoRange } from './DateRangeField';
import { maskDate, parseDisplay, toDisplay } from './dates';

// Fake only Date: a stubbed timer queue would stall Radix and user-event.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 9, 15, 12) });
});
afterEach(() => {
  vi.useRealTimers();
});

function Controlled({
  initial = '',
  onChange,
  maxDate,
}: {
  initial?: string;
  onChange?: (v: string) => void;
  maxDate?: string;
}) {
  const [value, setValue] = useState(initial);
  return (
    <DateField
      label="Fecha"
      value={value}
      maxDate={maxDate}
      onChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
    />
  );
}

const input = () => screen.getByRole('textbox', { name: 'Fecha' });

describe('date helpers', () => {
  it('masks digits into DD/MM/YYYY', () => {
    expect(maskDate('31102026')).toBe('31/10/2026');
    expect(maskDate('3a1')).toBe('31');
    expect(maskDate('311')).toBe('31/1');
  });

  it('parses only real dates', () => {
    expect(parseDisplay('31/10/2026')).toBe('2026-10-31');
    expect(parseDisplay('31/02/2026')).toBeNull();
    expect(parseDisplay('1/2/2026')).toBeNull();
  });

  it('does not shift days across time zones', () => {
    expect(toDisplay('2026-01-01')).toBe('01/01/2026');
  });
});

describe('DateField', () => {
  it('starts on today when left uncontrolled', () => {
    render(<DateField label="Fecha" />);
    expect(input()).toHaveValue('15/10/2026');
  });

  it('accepts a typed past date', async () => {
    const onChange = vi.fn();
    render(<Controlled onChange={onChange} maxDate="today" />);
    await userEvent.type(input(), '01102026');
    expect(onChange).toHaveBeenLastCalledWith('2026-10-01');
    expect(input()).toHaveValue('01/10/2026');
    expect(input()).toBeValid();
  });

  it('rejects a typed future date with maxDate=today and clears the value', async () => {
    const onChange = vi.fn();
    render(<Controlled initial="2026-10-01" onChange={onChange} maxDate="today" />);
    await userEvent.clear(input());
    await userEvent.type(input(), '16102026');
    expect(onChange).toHaveBeenLastCalledWith('');
    expect(input()).toBeInvalid();
    expect(input()).toHaveAccessibleDescription('La fecha no puede ser futura');
    expect(input()).toHaveValue('16/10/2026');
  });

  it('allows today itself', async () => {
    const onChange = vi.fn();
    render(<Controlled onChange={onChange} maxDate="today" />);
    await userEvent.type(input(), '15102026');
    expect(onChange).toHaveBeenLastCalledWith('2026-10-15');
  });

  it('allows future dates without maxDate', async () => {
    const onChange = vi.fn();
    render(<Controlled onChange={onChange} />);
    await userEvent.type(input(), '16102026');
    expect(onChange).toHaveBeenLastCalledWith('2026-10-16');
  });

  it('flags an impossible date, and a partial one on blur', async () => {
    render(<Controlled />);
    await userEvent.type(input(), '31022026');
    expect(input()).toHaveAccessibleDescription('Escribe una fecha válida (DD/MM/AAAA)');
    await userEvent.clear(input());
    await userEvent.type(input(), '12');
    expect(input()).toBeValid();
    await userEvent.tab();
    expect(input()).toBeInvalid();
  });

  it('disables future days in the calendar and picks a past one', async () => {
    const onChange = vi.fn();
    render(<Controlled initial="2026-10-10" onChange={onChange} maxDate="today" />);
    await userEvent.click(screen.getByRole('button', { name: 'Abrir calendario' }));
    const grid = await screen.findByRole('grid');
    expect(within(grid).getByRole('button', { name: /16 de octubre/ })).toBeDisabled();
    await userEvent.click(within(grid).getByRole('button', { name: /14 de octubre/ }));
    expect(onChange).toHaveBeenCalledWith('2026-10-14');
    expect(screen.queryByRole('grid')).toBeNull();
  });

  it('clears a rejection once a valid date is picked', async () => {
    render(<Controlled maxDate="today" />);
    fireEvent.change(input(), { target: { value: '16102026' } });
    expect(input()).toBeInvalid();
    await userEvent.click(screen.getByRole('button', { name: 'Abrir calendario' }));
    await userEvent.click(await screen.findByRole('button', { name: /14 de octubre/ }));
    expect(input()).toBeValid();
    expect(input()).toHaveValue('14/10/2026');
  });
});

describe('DateRangeField', () => {
  function Range({
    onChange,
    initial = null,
  }: {
    onChange?: (v: IsoRange | null) => void;
    initial?: IsoRange | null;
  }) {
    const [value, setValue] = useState<IsoRange | null>(initial);
    return (
      <DateRangeField
        label="Periodo"
        maxDate="today"
        value={value}
        onChange={(next) => {
          setValue(next);
          onChange?.(next);
        }}
      />
    );
  }
  const trigger = () => screen.getByRole('button', { name: /Periodo/ });
  const day = (n: number) =>
    screen.findByRole('button', { name: new RegExp(`\\b${n} de octubre`) });

  it('applies once both ends are picked', async () => {
    const onChange = vi.fn();
    render(<Range onChange={onChange} />);
    await userEvent.click(trigger());
    await userEvent.click(await day(3));
    expect(onChange).not.toHaveBeenCalled();
    await userEvent.click(await day(9));
    expect(onChange).toHaveBeenCalledWith({ from: '2026-10-03', to: '2026-10-09' });
    expect(trigger()).toHaveTextContent('03/10/2026 – 09/10/2026');
    expect(screen.queryByRole('grid')).toBeNull();
  });

  it('orders ends picked backwards', async () => {
    const onChange = vi.fn();
    render(<Range onChange={onChange} />);
    await userEvent.click(trigger());
    await userEvent.click(await day(9));
    await userEvent.click(await day(3));
    expect(onChange).toHaveBeenCalledWith({ from: '2026-10-03', to: '2026-10-09' });
  });

  it('starts over when an existing range is reopened', async () => {
    const onChange = vi.fn();
    render(<Range initial={{ from: '2026-10-03', to: '2026-10-09' }} onChange={onChange} />);
    await userEvent.click(trigger());
    await userEvent.click(await day(5));
    expect(onChange).not.toHaveBeenCalled();
    await userEvent.click(await day(7));
    expect(onChange).toHaveBeenCalledWith({ from: '2026-10-05', to: '2026-10-07' });
  });

  it('keeps future days out of reach', async () => {
    render(<Range />);
    await userEvent.click(trigger());
    expect(await day(16)).toBeDisabled();
  });

  it('clears with Borrar and leaves the range with Cancelar', async () => {
    const onChange = vi.fn();
    render(<Range initial={{ from: '2026-10-03', to: '2026-10-09' }} onChange={onChange} />);
    await userEvent.click(trigger());
    await userEvent.click(await screen.findByRole('button', { name: 'Cancelar' }));
    expect(onChange).not.toHaveBeenCalled();
    await act(async () => {
      await userEvent.click(trigger());
    });
    await userEvent.click(await screen.findByRole('button', { name: 'Borrar' }));
    expect(onChange).toHaveBeenCalledWith(null);
  });
});
