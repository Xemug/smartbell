import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';

import { FilterPanel, type FilterCategories, type FilterOf } from './FilterPanel';

const categories = {
  raza: {
    label: 'Raza',
    defaultVariable: 'holstein',
    variables: [
      { value: 'holstein', label: 'Holstein' },
      { value: 'jersey', label: 'Jersey' },
    ],
  },
  salud: {
    label: 'Salud',
    defaultVariable: 'saludables',
    variables: [
      { value: 'saludables', label: 'Saludables' },
      { value: 'enfermas', label: 'Enfermas' },
    ],
  },
} as const satisfies FilterCategories;
type Filter = FilterOf<typeof categories>;

const apply = () => screen.getByRole('button', { name: 'Aplicar filtro' });

function pick(name: string, option: string) {
  return async () => {
    await userEvent.click(screen.getByRole('combobox', { name }));
    await userEvent.click(screen.getByRole('option', { name: option }));
  };
}

function Host({
  onApply,
  initial = null,
}: {
  onApply: (f: Filter | null) => void;
  initial?: Filter | null;
}) {
  const [value, setValue] = useState<Filter | null>(initial);
  return (
    <FilterPanel
      categories={categories}
      value={value}
      onApply={(filter) => {
        setValue(filter);
        onApply(filter);
      }}
    />
  );
}

function SheetHost({
  onApply,
  initial = null,
}: {
  onApply: (f: Filter | null) => void;
  initial?: Filter | null;
}) {
  const [value, setValue] = useState<Filter | null>(initial);
  const [open, setOpen] = useState(true);
  return (
    <>
      <button onClick={() => setOpen(true)}>Abrir</button>
      <FilterPanel
        variant="sheet"
        open={open}
        onOpenChange={setOpen}
        categories={categories}
        value={value}
        onApply={(filter) => {
          setValue(filter);
          onApply(filter);
        }}
      />
    </>
  );
}

describe('FilterPanel types', () => {
  it('ties each category to its own variables', () => {
    expectTypeOf<Filter>().toEqualTypeOf<
      | { category: 'raza'; variable: 'holstein' | 'jersey' }
      | { category: 'salud'; variable: 'saludables' | 'enfermas' }
    >();
  });
});

describe('FilterPanel inline', () => {
  it('keeps Variable and Aplicar disabled until a category is chosen', () => {
    render(<Host onApply={() => undefined} />);
    expect(screen.getByRole('combobox', { name: 'Variable' })).toBeDisabled();
    expect(apply()).toBeDisabled();
  });

  it('preselects the default and emits the typed filter', async () => {
    const onApply = vi.fn();
    render(<Host onApply={onApply} />);
    await pick('Categoría', 'Raza')();
    expect(screen.getByRole('combobox', { name: 'Variable' })).toHaveTextContent('Holstein');
    expect(apply()).toBeEnabled();
    expect(onApply).not.toHaveBeenCalled();
    await userEvent.click(apply());
    expect(onApply).toHaveBeenCalledWith({ category: 'raza', variable: 'holstein' });
    expect(apply()).toBeDisabled();
  });

  it('emits the chosen variable, and resets it when the category changes', async () => {
    const onApply = vi.fn();
    render(<Host onApply={onApply} />);
    await pick('Categoría', 'Raza')();
    await pick('Variable', 'Jersey')();
    await userEvent.click(apply());
    expect(onApply).toHaveBeenLastCalledWith({ category: 'raza', variable: 'jersey' });
    await pick('Categoría', 'Salud')();
    expect(screen.getByRole('combobox', { name: 'Variable' })).toHaveTextContent('Saludables');
  });

  it('clears an applied filter with Sin filtro', async () => {
    const onApply = vi.fn();
    render(<Host onApply={onApply} initial={{ category: 'salud', variable: 'enfermas' }} />);
    await userEvent.click(screen.getByRole('button', { name: 'Sin filtro' }));
    expect(onApply).toHaveBeenCalledWith(null);
    expect(screen.getByRole('combobox', { name: 'Variable' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Sin filtro' })).not.toBeInTheDocument();
  });
});

describe('FilterPanel sheet', () => {
  it('asks for the variable once a category is chosen, then applies and closes', async () => {
    const onApply = vi.fn();
    render(<SheetHost onApply={onApply} />);
    expect(screen.getByRole('dialog', { name: 'Filtros disponibles' })).toBeInTheDocument();
    expect(apply()).toBeDisabled();
    expect(screen.queryByRole('radio', { name: 'Holstein' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('radio', { name: 'Raza' }));
    expect(screen.getByRole('radio', { name: 'Holstein' })).toBeChecked();
    await userEvent.click(screen.getByRole('radio', { name: 'Jersey' }));
    await userEvent.click(apply());
    expect(onApply).toHaveBeenCalledWith({ category: 'raza', variable: 'jersey' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('forgets an unapplied choice when dismissed', async () => {
    render(<SheetHost onApply={() => undefined} />);
    await userEvent.click(screen.getByRole('radio', { name: 'Raza' }));
    await userEvent.keyboard('{Escape}');
    await userEvent.click(screen.getByRole('button', { name: 'Abrir', hidden: true }));
    expect(screen.getByRole('radio', { name: 'Raza' })).not.toBeChecked();
    expect(apply()).toBeDisabled();
  });
});
