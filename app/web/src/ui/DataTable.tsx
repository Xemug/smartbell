import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { Banner } from './Banner';
import { Checkbox } from './Checkbox';
import { cx, focusRing } from './cx';
import { IconButton } from './IconButton';
import { iconArrowDown, iconArrowUp, type Glyph } from './icons/glyphs';
import { Icon } from './icons/Icon';
import { Pagination } from './Pagination';
import { sortRows } from './sortRows';

export const PAGE_SIZE = 10;

export interface DataTableColumn<Row> {
  key: string;
  header: string;
  /** What the cell shows; `sortValue` is used when omitted. */
  cell?: (row: Row) => ReactNode;
  /** Present on a sortable column: what it sorts by. */
  sortValue?: (row: Row) => string | number | null | undefined;
  /** Web only, as in Header Table vs Header Table_Mobile. */
  hideOnMobile?: boolean;
  align?: 'left' | 'right';
}

export interface DataTableRowAction<Row> {
  label: string;
  icon: Glyph;
  onClick: (row: Row) => void;
  hideOnMobile?: boolean;
}

export interface DataTableSort {
  column: string;
  direction: 'asc' | 'desc';
}

interface DataTableProps<Row> {
  /** Names the table for screen readers. */
  label: string;
  columns: DataTableColumn<Row>[];
  rows: Row[];
  getRowId: (row: Row) => string;
  /** Names a row for the selection and action buttons. */
  getRowLabel?: (row: Row) => string;
  rowActions?: DataTableRowAction<Row>[];
  /** Selected ids. Passing `onSelectionChange` turns the checkboxes on. */
  selected?: string[];
  onSelectionChange?: (ids: string[]) => void;
  /**
   * The server pages and sorts: `rows` is only the current page and this is the full count.
   * Without it the table does both itself. Pair it with `sort`/`onSortChange` and
   * `page`/`onPageChange`.
   */
  total?: number;
  sort?: DataTableSort | null;
  onSortChange?: (sort: DataTableSort | null) => void;
  /** Counted from 1. */
  page?: number;
  onPageChange?: (page: number) => void;
  /** Replaces the default "no animals with this filter" alert. */
  empty?: ReactNode;
  loading?: boolean;
  className?: string;
}

function SortMark({ direction }: { direction?: DataTableSort['direction'] }) {
  return (
    <span aria-hidden className="flex shrink-0">
      <Icon icon={iconArrowUp} size={14} className={cx(direction === 'desc' && 'opacity-40')} />
      <Icon icon={iconArrowDown} size={14} className={cx(direction === 'asc' && 'opacity-40')} />
    </span>
  );
}

export function DataTable<Row>({
  label,
  columns,
  rows,
  getRowId,
  getRowLabel = getRowId,
  rowActions,
  selected: selectedProp,
  onSelectionChange,
  total,
  sort: sortProp,
  onSortChange,
  page: pageProp,
  onPageChange,
  empty,
  loading = false,
  className,
}: DataTableProps<Row>) {
  const { t } = useTranslation();
  const serverSide = total !== undefined;
  const [ownSort, setOwnSort] = useState<DataTableSort | null>(null);
  const [ownPage, setOwnPage] = useState(1);
  const [ownSelected, setOwnSelected] = useState<string[]>([]);
  const sort = sortProp === undefined ? ownSort : sortProp;
  const selected = selectedProp ?? ownSelected;
  const selectable = onSelectionChange !== undefined || selectedProp !== undefined;

  const count = total ?? rows.length;
  const pageCount = Math.max(1, Math.ceil(count / PAGE_SIZE));
  // A shorter list must not strand the reader on a page that no longer exists.
  const page = Math.min(pageProp ?? ownPage, pageCount);

  const visible = useMemo(() => {
    if (serverSide) return rows;
    const start = (page - 1) * PAGE_SIZE;
    return sortRows(rows, columns, sort).slice(start, start + PAGE_SIZE);
  }, [serverSide, rows, columns, sort, page]);

  const setPage = (next: number) => {
    setOwnPage(next);
    onPageChange?.(next);
  };
  const setSelected = (ids: string[]) => {
    setOwnSelected(ids);
    onSelectionChange?.(ids);
  };

  const toggleSort = (column: string) => {
    const direction = sort?.column === column && sort.direction === 'asc' ? 'desc' : 'asc';
    const next = { column, direction } as const;
    setOwnSort(next);
    onSortChange?.(next);
    setPage(1);
  };

  // Filtering must not leave hidden rows selected, or a bulk delete would reach them. With a
  // server the other pages are not here to check, so its caller clears them on a new filter.
  const known = serverSide ? null : rows.map(getRowId).join('\n');
  useEffect(() => {
    if (known === null) return;
    const ids = new Set(known.split('\n'));
    const kept = selected.filter((id) => ids.has(id));
    if (kept.length !== selected.length) setSelected(kept);
    // Only a change in the rows should trigger this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [known]);

  const visibleIds = visible.map(getRowId);
  const pageChecked = visibleIds.filter((id) => selected.includes(id)).length;
  const toggleAll = (checked: boolean) =>
    setSelected(
      checked
        ? [...new Set([...selected, ...visibleIds])]
        : selected.filter((id) => !visibleIds.includes(id)),
    );
  const toggleRow = (id: string, checked: boolean) =>
    setSelected(checked ? [...selected, id] : selected.filter((other) => other !== id));

  const onMobile = (hide?: boolean) => (hide ? 'hidden md:table-cell' : undefined);
  const hasMobileActions = rowActions?.some((action) => !action.hideOnMobile);
  const colSpan = columns.length + (selectable ? 1 : 0) + (rowActions?.length ? 1 : 0);

  return (
    <div className={cx('flex flex-col gap-4', className)}>
      {/* A narrow screen scrolls the table, not the page. */}
      <div className="overflow-x-auto rounded-moon-i-xs">
        <table aria-label={label} aria-busy={loading || undefined} className="w-full bg-neutral-1">
          <thead className="bg-primary-text text-button-text">
            <tr>
              {selectable && (
                <th scope="col" className="w-10 pl-3">
                  <Checkbox
                    aria-label={t('ui.selectPage')}
                    className="align-middle"
                    value={pageChecked > 0 && pageChecked === visibleIds.length}
                    indeterminate={pageChecked > 0 && pageChecked < visibleIds.length}
                    disabled={visibleIds.length === 0}
                    onChange={toggleAll}
                  />
                </th>
              )}
              {columns.map((column) => {
                const active = sort?.column === column.key ? sort.direction : undefined;
                const align = column.align === 'right' ? 'text-right' : 'text-left';
                return (
                  <th
                    key={column.key}
                    scope="col"
                    aria-sort={
                      active === 'asc' ? 'ascending' : active === 'desc' ? 'descending' : undefined
                    }
                    className={cx(
                      'h-10 whitespace-nowrap px-3 type-label-md',
                      align,
                      onMobile(column.hideOnMobile),
                    )}
                  >
                    {column.sortValue ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(column.key)}
                        className={cx('inline-flex items-center gap-1 rounded-sm', focusRing)}
                      >
                        {column.header}
                        <SortMark direction={active} />
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
              {rowActions && rowActions.length > 0 && (
                <th
                  scope="col"
                  className={cx(
                    'px-3 text-left type-label-md',
                    !hasMobileActions && 'hidden md:table-cell',
                  )}
                >
                  {/* Mobile draws only the icon, with no title over it. */}
                  <span className="sr-only md:not-sr-only">{t('ui.actions')}</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="p-4">
                  {empty ?? <Banner tone="error">{t('ui.noFilterResults')}</Banner>}
                </td>
              </tr>
            ) : (
              visible.map((row) => {
                const id = getRowId(row);
                const name = getRowLabel(row);
                const isSelected = selected.includes(id);
                return (
                  <tr key={id} className={cx('h-12 border-b', isSelected && 'bg-primary-10')}>
                    {selectable && (
                      <td className="pl-3">
                        <Checkbox
                          aria-label={t('ui.selectRow', { row: name })}
                          className="align-middle"
                          value={isSelected}
                          onChange={(checked) => toggleRow(id, checked)}
                        />
                      </td>
                    )}
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={cx(
                          'px-3 type-body-md',
                          column.align === 'right' && 'text-right',
                          onMobile(column.hideOnMobile),
                        )}
                      >
                        {column.cell ? column.cell(row) : column.sortValue?.(row)}
                      </td>
                    ))}
                    {rowActions && rowActions.length > 0 && (
                      <td className={cx('px-3', !hasMobileActions && 'hidden md:table-cell')}>
                        <div className="flex gap-1">
                          {rowActions.map((action) => (
                            <IconButton
                              key={action.label}
                              icon={action.icon}
                              label={`${action.label} ${name}`}
                              variant="ghost"
                              size="sm"
                              className={cx(action.hideOnMobile && 'hidden md:inline-flex')}
                              onClick={() => action.onClick(row)}
                            />
                          ))}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {pageCount > 1 && (
        <Pagination
          page={page}
          pageCount={pageCount}
          onPageChange={setPage}
          className="justify-center"
        />
      )}
    </div>
  );
}
