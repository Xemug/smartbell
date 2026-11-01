import type { DataTableColumn, DataTableSort } from './DataTable';

const collator = new Intl.Collator('es-MX', { numeric: true, sensitivity: 'base' });

function compare(a: string | number, b: string | number): number {
  return typeof a === 'number' && typeof b === 'number'
    ? a - b
    : collator.compare(String(a), String(b));
}

/** Sorts a copy. Blanks go last in both directions, so they never bury the real values. */
export function sortRows<Row>(
  rows: Row[],
  columns: DataTableColumn<Row>[],
  sort: DataTableSort | null,
): Row[] {
  const value = columns.find((column) => column.key === sort?.column)?.sortValue;
  if (!sort || !value) return rows;
  const sign = sort.direction === 'asc' ? 1 : -1;
  const blank = (v: unknown) => v === null || v === undefined || v === '';
  return [...rows].sort((rowA, rowB) => {
    const a = value(rowA);
    const b = value(rowB);
    if (blank(a) || blank(b)) return Number(blank(a)) - Number(blank(b));
    return sign * compare(a as string | number, b as string | number);
  });
}
