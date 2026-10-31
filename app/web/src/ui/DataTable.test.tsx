import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { DataTable, type DataTableColumn } from './DataTable';
import { iconTrash } from './icons/glyphs';
import { sortRows } from './sortRows';

interface Row {
  id: string;
  dim: number | null;
  name: string;
}

const rows: Row[] = Array.from({ length: 23 }, (_, index) => ({
  id: String(index + 1).padStart(2, '0'),
  dim: index === 1 ? null : 100 - index,
  name: `Vaca ${index + 1}`,
}));

const columns: DataTableColumn<Row>[] = [
  { key: 'id', header: 'ID', sortValue: (row) => row.id },
  { key: 'dim', header: 'DIM', sortValue: (row) => row.dim },
  { key: 'name', header: 'Nombre', cell: (row) => row.name, hideOnMobile: true },
];

// `column` skips the checkbox cell on selectable tables.
const ids = (column = 0) =>
  screen
    .getAllByRole('row')
    .slice(1)
    .map((row) => within(row).getAllByRole('cell')[column]?.textContent);

const table = (props = {}) => (
  <DataTable label="Vacas" columns={columns} rows={rows} getRowId={(row) => row.id} {...props} />
);

describe('sortRows', () => {
  it('orders numerically inside text, and keeps blanks last both ways', () => {
    const data = [{ n: 'A10' }, { n: '' }, { n: 'A9' }, { n: 'a2' }];
    const col = [{ key: 'n', header: 'N', sortValue: (r: { n: string }) => r.n }];
    const run = (direction: 'asc' | 'desc') =>
      sortRows(data, col, { column: 'n', direction }).map((r) => r.n);
    expect(run('asc')).toEqual(['a2', 'A9', 'A10', '']);
    expect(run('desc')).toEqual(['A10', 'A9', 'a2', '']);
  });

  it('leaves the input alone', () => {
    const copy = [...rows];
    sortRows(rows, columns, { column: 'dim', direction: 'asc' });
    expect(rows).toEqual(copy);
  });
});

describe('DataTable', () => {
  it('shows 10 per page and moves between pages', async () => {
    render(table());
    expect(ids()).toHaveLength(10);
    expect(ids()[0]).toBe('01');
    await userEvent.click(screen.getByRole('button', { name: 'Ir a la página 3' }));
    expect(ids()).toEqual(['21', '22', '23']);
  });

  it('hides the pager when everything fits', () => {
    render(table({ rows: rows.slice(0, 10) }));
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('sorts both ways, reports it, and goes back to page 1', async () => {
    render(table());
    await userEvent.click(screen.getByRole('button', { name: 'Ir a la página 2' }));
    const dim = screen.getByRole('button', { name: 'DIM' });
    const header = screen.getByRole('columnheader', { name: 'DIM' });
    expect(header).not.toHaveAttribute('aria-sort');
    await userEvent.click(dim);
    expect(header).toHaveAttribute('aria-sort', 'ascending');
    expect(ids()[0]).toBe('23');
    await userEvent.click(dim);
    expect(header).toHaveAttribute('aria-sort', 'descending');
    expect(ids()[0]).toBe('01');
    expect(screen.getByRole('button', { name: 'Ir a la página 1' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('has no sort button on a column without a sort value', () => {
    render(table());
    expect(screen.queryByRole('button', { name: 'Nombre' })).not.toBeInTheDocument();
  });

  it('selects rows, a whole page, and keeps selection across pages', async () => {
    const onSelectionChange = vi.fn();
    render(table({ onSelectionChange }));
    const all = screen.getByRole('checkbox', { name: 'Seleccionar los de esta página' });

    await userEvent.click(screen.getByRole('checkbox', { name: 'Seleccionar 01' }));
    expect(onSelectionChange).toHaveBeenLastCalledWith(['01']);
    expect(all).toHaveAttribute('data-state', 'indeterminate');

    await userEvent.click(all);
    expect(onSelectionChange.mock.lastCall?.[0]).toHaveLength(10);

    await userEvent.click(screen.getByRole('button', { name: 'Ir a la página 2' }));
    expect(all).not.toBeChecked();
    await userEvent.click(screen.getByRole('checkbox', { name: 'Seleccionar 11' }));
    expect(onSelectionChange.mock.lastCall?.[0]).toHaveLength(11);

    await userEvent.click(screen.getByRole('button', { name: 'Ir a la página 1' }));
    expect(all).toBeChecked();
    await userEvent.click(all);
    expect(onSelectionChange).toHaveBeenLastCalledWith(['11']);
  });

  it('has no checkboxes unless asked', () => {
    render(table());
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('drops selected rows that a filter removed', async () => {
    function Host() {
      const [selected, setSelected] = useState(['01', '02']);
      const [shown, setShown] = useState(rows);
      return (
        <>
          <button onClick={() => setShown(rows.slice(1))}>Filtrar</button>
          <output>{selected.join()}</output>
          {table({ rows: shown, selected, onSelectionChange: setSelected })}
        </>
      );
    }
    render(<Host />);
    await userEvent.click(screen.getByRole('button', { name: 'Filtrar' }));
    expect(screen.getByRole('status')).toHaveTextContent('02');
    expect(screen.getByRole('status')).not.toHaveTextContent('01');
  });

  it('falls back to the last page when the list shrinks', async () => {
    const { rerender } = render(table());
    await userEvent.click(screen.getByRole('button', { name: 'Ir a la página 3' }));
    rerender(table({ rows: rows.slice(0, 12) }));
    expect(ids()).toEqual(['11', '12']);
  });

  it('runs row actions, naming the row', async () => {
    const onClick = vi.fn();
    render(
      table({
        getRowLabel: (row: Row) => row.name,
        rowActions: [{ label: 'Eliminar', icon: iconTrash, onClick }],
      }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Eliminar Vaca 3' }));
    expect(onClick).toHaveBeenCalledWith(rows[2]);
  });

  it('shows the empty alert, spanning the table, and nothing to select', () => {
    render(table({ rows: [], onSelectionChange: () => undefined }));
    expect(screen.getByRole('alert')).toHaveTextContent(
      'No encontramos animales con el filtro aplicado',
    );
    expect(screen.getByRole('alert').closest('td')).toHaveAttribute('colspan', '4');
    expect(screen.getByRole('checkbox')).toBeDisabled();
  });

  it('takes a custom empty state', () => {
    render(table({ rows: [], empty: <p>Aún no tienes vacas</p> }));
    expect(screen.getByText('Aún no tienes vacas')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('leaves paging and sorting to the server when given a total', async () => {
    const onSortChange = vi.fn();
    const onPageChange = vi.fn();
    const onSelectionChange = vi.fn();
    const pageRows = rows.slice(10, 20);
    const { rerender } = render(
      table({
        rows: pageRows,
        total: 23,
        page: 2,
        onPageChange,
        sort: null,
        onSortChange,
        onSelectionChange,
        selected: ['01'],
      }),
    );
    expect(ids(1)).toEqual(pageRows.map((row) => row.id));
    await userEvent.click(screen.getByRole('button', { name: 'Ir a la página 3' }));
    expect(onPageChange).toHaveBeenLastCalledWith(3);
    await userEvent.click(screen.getByRole('button', { name: 'DIM' }));
    expect(onSortChange).toHaveBeenLastCalledWith({ column: 'dim', direction: 'asc' });
    expect(onPageChange).toHaveBeenLastCalledWith(1);
    // The server's order stands, and a selection on another page survives.
    expect(ids(1)).toEqual(pageRows.map((row) => row.id));
    expect(onSelectionChange).not.toHaveBeenCalled();

    rerender(
      table({
        rows: pageRows,
        total: 23,
        page: 2,
        sort: { column: 'dim', direction: 'desc' },
        onSortChange,
      }),
    );
    expect(screen.getByRole('columnheader', { name: 'DIM' })).toHaveAttribute(
      'aria-sort',
      'descending',
    );
  });
});
