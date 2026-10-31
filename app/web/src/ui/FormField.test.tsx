import { zodResolver } from '@hookform/resolvers/zod';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { Button } from './Button';
import { Checkbox } from './Checkbox';
import { DateField } from './DateField';
import { FormField } from './FormField';
import { Select } from './Select';
import { TextField } from './TextField';

const schema = z.object({
  name: z.string().min(1, 'validation.required'),
  nickname: z.string().min(3, 'Tres letras'),
  breed: z.string().min(1, 'validation.required'),
  date: z.string().min(1, 'validation.required'),
  active: z.boolean(),
});
type Values = z.infer<typeof schema>;

function Sample({ onValid, date = '' }: { onValid: (values: Values) => void; date?: string }) {
  const { control, handleSubmit } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', nickname: 'Lola', breed: '', date, active: false },
  });
  return (
    <form noValidate onSubmit={handleSubmit((values) => onValid(values))}>
      <FormField
        control={control}
        name="name"
        render={(field) => <TextField label="Nombre" {...field} />}
      />
      <FormField
        control={control}
        name="nickname"
        render={(field) => <TextField label="Apodo" {...field} />}
      />
      <FormField
        control={control}
        name="breed"
        render={(field) => (
          <Select label="Raza" options={[{ value: 'h', label: 'Holstein' }]} {...field} />
        )}
      />
      <FormField
        control={control}
        name="date"
        render={(field) => <DateField label="Fecha" maxDate="2026-10-15" {...field} />}
      />
      <FormField
        control={control}
        name="active"
        render={(field) => <Checkbox label="Activa" {...field} error={Boolean(field.error)} />}
      />
      <Button type="submit">Guardar</Button>
    </form>
  );
}

const save = () => userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

describe('FormField', () => {
  it('shows translated zod errors and focuses the first bad field', async () => {
    const onValid = vi.fn();
    render(<Sample onValid={onValid} />);
    await save();
    const name = screen.getByRole('textbox', { name: 'Nombre' });
    expect(await screen.findAllByText('Este campo es obligatorio')).toHaveLength(3);
    expect(name).toBeInvalid();
    expect(name).toHaveFocus();
    expect(onValid).not.toHaveBeenCalled();
  });

  it('passes literal messages through', async () => {
    render(<Sample onValid={vi.fn()} />);
    const nickname = screen.getByRole('textbox', { name: 'Apodo' });
    await userEvent.clear(nickname);
    await save();
    expect(await screen.findByText('Tres letras')).toBeInTheDocument();
  });

  it('submits the values of every kind of control', async () => {
    const onValid = vi.fn();
    render(<Sample onValid={onValid} date="2026-10-10" />);
    await userEvent.type(screen.getByRole('textbox', { name: 'Nombre' }), 'Rosa');
    await userEvent.click(screen.getByRole('combobox', { name: 'Raza' }));
    await userEvent.click(await screen.findByRole('option', { name: 'Holstein' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Activa' }));
    await save();
    expect(onValid).toHaveBeenCalledWith({
      name: 'Rosa',
      nickname: 'Lola',
      breed: 'h',
      date: '2026-10-10',
      active: true,
    });
  });

  it('cannot save a date the field rejected', async () => {
    const onValid = vi.fn();
    render(<Sample onValid={onValid} date="2026-10-10" />);
    const date = screen.getByRole('textbox', { name: 'Fecha' });
    await userEvent.clear(date);
    await userEvent.type(date, '16102026');
    await userEvent.type(screen.getByRole('textbox', { name: 'Nombre' }), 'Rosa');
    await save();
    expect(onValid).not.toHaveBeenCalled();
  });
});
