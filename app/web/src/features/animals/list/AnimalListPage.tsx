import { useEffect, useMemo, useRef, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { useActiveRanch } from '../../../app/useActiveRanch';
import { useIsDesktop } from '../../../app/useIsDesktop';
import { Banner } from '../../../ui/Banner';
import { Button } from '../../../ui/Button';
import { cx, focusRing } from '../../../ui/cx';
import {
  DataTable,
  PAGE_SIZE,
  type DataTableColumn,
  type DataTableRowAction,
  type DataTableSort,
} from '../../../ui/DataTable';
import {
  FilterPanel,
  type FilterCategories,
  type FilterCategory,
  type FilterOf,
} from '../../../ui/FilterPanel';
import { IconButton } from '../../../ui/IconButton';
import {
  iconArrowRight,
  iconBull,
  iconCow,
  iconHeifer,
  iconPlus,
  iconSliders,
  iconTrash,
  iconX,
  type Glyph,
} from '../../../ui/icons/glyphs';
import { Icon } from '../../../ui/icons/Icon';
import { Tabs } from '../../../ui/Tabs';
import { TextField } from '../../../ui/TextField';
import { useSnackbar } from '../../../ui/useSnackbar';
import { MoveToGroupDialog } from '../../groups/MoveToGroupDialog';
import { ageInMonths, daysInMilk } from './animalFacts';
import { useAnimalPage, useGroups, useKindCount, useRemoveAnimals, type Animal } from './api';
import {
  categoriesFor,
  LIST_KINDS,
  listQuery,
  listStateParams,
  parseListState,
  variablesFor,
  type ListKind,
  type ListState,
  type RemovalReason,
} from './listState';
import { RemoveAnimalsDialog } from './RemoveAnimalsDialog';

export const ANIMALS_PATH = '/vacas';
/** The registration form's route, held by `animal-forms`. */
export const NEW_ANIMAL_PATH = `${ANIMALS_PATH}/nueva`;

const KIND_ICONS: Record<ListKind, Glyph> = {
  vacas: iconCow,
  vaquillas: iconHeifer,
  toros: iconBull,
};
const KINDS = Object.keys(LIST_KINDS) as ListKind[];
const SEARCH_DELAY_MS = 300;

/** "Vacas · 003": the counter on each list's tab. */
function useKindLabels(compact: boolean): Record<ListKind, string> {
  const { t } = useTranslation();
  const counts = {
    vacas: useKindCount('vacas'),
    vaquillas: useKindCount('vaquillas'),
    toros: useKindCount('toros'),
  };
  const label = (kind: ListKind) => {
    const total = counts[kind].data;
    const name = t(`animals.kinds.${kind}`);
    if (total === undefined) return name;
    // A phone has room for the three tabs only without the separator and padding.
    return compact ? `${name} ${total}` : `${name} · ${String(total).padStart(3, '0')}`;
  };
  return { vacas: label('vacas'), vaquillas: label('vaquillas'), toros: label('toros') };
}

/** The Vacas tab: cows, heifers and bulls, with search, filter, sort, pages and bajas (B1, 1.14). */
export function AnimalListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const desktop = useIsDesktop();
  const { can } = useActiveRanch();
  const snackbar = useSnackbar();
  const [params, setParams] = useSearchParams();
  const state = useMemo(() => parseListState(params), [params]);
  const latestParams = useRef(params);
  latestParams.current = params;
  const today = useMemo(() => new Date(), []);
  const query = listQuery(state, today, PAGE_SIZE);
  const page = useAnimalPage(query);
  const groups = useGroups();
  const remove = useRemoveAnimals();
  const kindLabels = useKindLabels(!desktop);

  const [selected, setSelected] = useState<string[]>([]);
  const [toRemove, setToRemove] = useState<Animal[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const removeFrom = useRef<HTMLElement | null>(null);
  const [toMove, setToMove] = useState<string[] | null>(null);

  const update = (patch: Partial<ListState>, options: { replace?: boolean } = {}) => {
    const restart = patch.kind !== undefined || patch.q !== undefined || patch.filter !== undefined;
    // A new list, search or filter starts over with nothing selected.
    if (restart) setSelected([]);
    if (patch.kind !== undefined && patch.kind !== state.kind) setSearch('');
    // From the URL last written, not this render's: the table changes sort and page in one click,
    // and react-router's functional setter would still hand both the same params.
    const before = parseListState(latestParams.current);
    const next = { ...before, ...patch };
    if (restart) next.page = 1;
    if (patch.kind !== undefined && patch.kind !== before.kind) {
      next.filter = null;
      next.sort = null;
      next.q = '';
    }
    const out = listStateParams(next);
    // The table follows a sort with "page 1"; the same URL twice would need two Backs.
    if (out.toString() === latestParams.current.toString()) return;
    latestParams.current = out;
    setParams(out, { replace: options.replace });
  };

  // The box answers each keystroke; the URL (and the request) follow once typing pauses.
  const [search, setSearch] = useState(state.q);
  useEffect(() => setSearch(state.q), [state.q]);
  useEffect(() => {
    if (search === state.q) return;
    const timer = setTimeout(() => update({ q: search }, { replace: true }), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
    // Only a new search string should restart the wait.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const groupNames = useMemo(() => {
    const names = new Map<string, string>();
    for (const group of groups.data ?? []) {
      names.set(group.id, group.preset ? t(`animals.values.grupo.${group.preset}`) : group.name);
    }
    return names;
  }, [groups.data, t]);
  const customGroups = (groups.data ?? []).filter((g) => !g.preset);

  const categories = useMemo(() => {
    const result: Record<string, FilterCategory> = {};
    for (const { category, defaultVariable } of categoriesFor(state.kind)) {
      const values = variablesFor(
        state.kind,
        category,
        customGroups.map((g) => g.id),
      );
      result[category] = {
        label: t(`animals.filters.${category}`),
        defaultVariable,
        variables: values.map((value) => ({
          value,
          label:
            category === 'grupo' && groupNames.has(value)
              ? (groupNames.get(value) ?? value)
              : t(`animals.values.${category}.${value}`),
        })),
      };
    }
    return result as FilterCategories;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.kind, groupNames, t]);

  const filterValue = state.filter as FilterOf<FilterCategories> | null;
  const applyFilter = (filter: FilterOf<FilterCategories> | null) =>
    update({ filter: filter as ListState['filter'] });

  const showingRemoved = state.filter?.category === 'bajas';
  const canRemove = can('ANIMALS_DELETE') && !showingRemoved;
  // Bulk "Cambiar de potrero" (groups card); a baja has no potrero to change.
  const canMove = can('GROUPS_VIEW_EDIT') && !showingRemoved;
  const selectable = canRemove || canMove;

  const kindNoun = t(`animals.nouns.${state.kind}`);
  const dash = t('animals.none');
  const idColumn: DataTableColumn<Animal> = {
    key: 'id',
    header: t(`animals.columns.id.${state.kind}`),
    sortValue: (a) => a.control_id,
    cell: (a) => (
      <Link
        to={`${ANIMALS_PATH}/${a.id}`}
        className={cx('inline-flex items-center gap-2 rounded-sm text-primary-text', focusRing)}
      >
        <Icon
          icon={KIND_ICONS[state.kind]}
          size={28}
          className="hidden text-secondary-text md:block"
        />
        <span className="underline-offset-2 hover:underline">{a.control_id}</span>
      </Link>
    ),
  };
  const breedColumn: DataTableColumn<Animal> = {
    key: 'raza',
    header: t('animals.columns.raza'),
    hideOnMobile: true,
    cell: (a) => t(`animals.values.raza.${a.breed}`),
  };
  const groupColumn: DataTableColumn<Animal> = {
    key: 'grupo',
    header: t('animals.columns.grupo'),
    hideOnMobile: true,
    // No group is the General potrero (domain-model §7).
    cell: (a) =>
      a.group_id ? (groupNames.get(a.group_id) ?? dash) : t('animals.values.grupo.GENERAL'),
  };
  const ageColumn: DataTableColumn<Animal> = {
    key: 'edad',
    header: t('animals.columns.edad'),
    align: 'right',
    sortValue: (a) => ageInMonths(a, today),
    cell: (a) => t('animals.months', { count: ageInMonths(a, today) }),
  };
  const columns: DataTableColumn<Animal>[] =
    state.kind === 'vacas'
      ? [
          idColumn,
          breedColumn,
          {
            key: 'estado',
            header: t('animals.columns.estado'),
            cell: (a) =>
              // The reproductive state, as the Reproducción filter reads it; DEL already says
              // whether she milks. Lactation only fills in when no repro state is recorded.
              a.repro_state
                ? t(`animals.values.repro.${a.repro_state}`)
                : a.lactation_state
                  ? t(`animals.lactation.${a.lactation_state}`)
                  : dash,
          },
          {
            key: 'dim',
            header: t('animals.columns.dim'),
            align: 'right',
            sortValue: (a) => daysInMilk(a, today),
            cell: (a) => daysInMilk(a, today) ?? dash,
          },
          groupColumn,
        ]
      : state.kind === 'vaquillas'
        ? [
            idColumn,
            breedColumn,
            {
              key: 'estado',
              header: t('animals.columns.estado'),
              cell: (a) => (a.repro_state ? t(`animals.values.repro.${a.repro_state}`) : dash),
            },
            ageColumn,
            groupColumn,
          ]
        : [
            idColumn,
            breedColumn,
            {
              key: 'nombre',
              header: t('animals.columns.nombre'),
              hideOnMobile: true,
              cell: (a) => a.name ?? dash,
            },
            ageColumn,
            {
              key: 'siniiga',
              header: t('animals.columns.siniiga'),
              hideOnMobile: true,
              cell: (a) => a.siniiga ?? dash,
            },
          ];

  const rowActions: DataTableRowAction<Animal>[] | undefined = canRemove
    ? [
        {
          label: t('animals.remove.one'),
          icon: iconTrash,
          onClick: (animal) => {
            removeFrom.current = document.activeElement as HTMLElement | null;
            setToRemove([animal]);
          },
        },
      ]
    : undefined;

  const rows = useMemo(() => page.data?.items ?? [], [page.data]);
  // Selection survives paging, so the dialog names animals from pages no longer on screen.
  const seenRows = useRef(new Map<string, Animal>());
  useEffect(() => {
    for (const row of rows) seenRows.current.set(row.id, row);
  }, [rows]);
  const selectedRows = (ids: string[]) =>
    ids.flatMap((id) => {
      const row = seenRows.current.get(id) ?? rows.find((r) => r.id === id);
      return row ? [row] : [];
    });

  const confirmRemove = (reason: RemovalReason) => {
    if (!toRemove) return;
    const ids = toRemove.map((a) => a.id);
    const names = new Map(toRemove.map((a) => [a.id, a.control_id]));
    remove.mutate(
      { ids, reason },
      {
        onSuccess: ({ removed, failed }) => {
          setToRemove(null);
          setSelected((current) => current.filter((id) => !removed.includes(id)));
          if (removed.length > 0) {
            snackbar.show({
              kind: 'deleted',
              message: t('animals.remove.done', { count: removed.length }),
            });
          }
          if (failed.length > 0) {
            const list = failed.map((f) => names.get(f.id) ?? f.id).join(', ');
            setError(t('animals.remove.failed', { count: failed.length, ids: list }));
          }
        },
        onError: () => {
          setToRemove(null);
          setError(t('animals.remove.error'));
        },
      },
    );
  };

  const filtered = state.filter !== null || state.q.trim() !== '';
  const empty = filtered ? undefined : (
    <p className="text-center text-secondary-text type-body-md">
      {t(`animals.emptyList.${state.kind}`)}
    </p>
  );

  const sort: DataTableSort | null = state.sort;

  const body = (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        {can('ANIMALS_CREATE') && (
          <Button
            leadingIcon={iconPlus}
            onClick={() => navigate(`${NEW_ANIMAL_PATH}?tipo=${state.kind}`)}
          >
            {t(`animals.add.${state.kind}`)}
          </Button>
        )}
        <TextField
          type="search"
          label={desktop ? t('animals.search.label', { noun: kindNoun }) : undefined}
          aria-label={t('animals.search.label', { noun: kindNoun })}
          placeholder={t('animals.search.placeholder')}
          value={search}
          maxLength={60}
          onChange={(event) => setSearch(event.target.value)}
          className="min-w-0 flex-1 lg:max-w-60 lg:flex-none"
        />
        {desktop ? (
          <FilterPanel
            categories={categories}
            value={filterValue}
            onApply={applyFilter}
            className="flex-1"
          />
        ) : (
          <>
            <IconButton
              icon={iconSliders}
              label={t('ui.filtersTitle')}
              variant={state.filter ? 'fill' : 'outline'}
              onClick={() => setSheetOpen(true)}
            />
            <FilterPanel
              variant="sheet"
              open={sheetOpen}
              onOpenChange={setSheetOpen}
              categories={categories}
              value={filterValue}
              onApply={applyFilter}
            />
          </>
        )}
      </div>

      {state.filter && (
        <p className="text-secondary-text type-body-sm">
          {t('animals.filterInForce', {
            category: categories[state.filter.category]?.label,
            variable:
              categories[state.filter.category]?.variables.find(
                (v) => v.value === state.filter?.variable,
              )?.label ??
              groupNames.get(state.filter.variable) ??
              (groups.isPending ? '…' : t('animals.unknownGroup')),
          })}
        </p>
      )}

      {selected.length > 0 && selectable && (
        <div
          role="region"
          aria-label={t('animals.bulk.label')}
          className="flex flex-wrap items-center gap-3 rounded-moon-i-xs bg-primary-10 px-3 py-2"
        >
          <span className="type-label-md text-primary-text">
            {t('animals.bulk.selected', { count: selected.length })}
          </span>
          {canMove && (
            <Button
              size="sm"
              leadingIcon={iconArrowRight}
              onClick={(event) => {
                removeFrom.current = event.currentTarget;
                setToMove(selected);
              }}
            >
              {t('animals.bulk.move')}
            </Button>
          )}
          {canRemove && (
            <Button
              size="sm"
              variant="danger"
              leadingIcon={iconTrash}
              onClick={(event) => {
                removeFrom.current = event.currentTarget;
                setToRemove(selectedRows(selected));
              }}
            >
              {t('animals.bulk.remove')}
            </Button>
          )}
          <IconButton
            icon={iconX}
            size="sm"
            variant="ghost"
            label={t('animals.bulk.clear')}
            onClick={() => setSelected([])}
          />
        </div>
      )}

      {error && (
        <Banner tone="error" onClose={() => setError(null)}>
          {error}
        </Banner>
      )}

      {page.isError ? (
        <Banner tone="error" title={t('animals.loadError')}>
          <Button size="sm" variant="outline" onClick={() => void page.refetch()}>
            {t('animals.retry')}
          </Button>
        </Banner>
      ) : (
        <DataTable
          label={t(`animals.kinds.${state.kind}`)}
          columns={columns}
          rows={rows}
          getRowId={(a) => a.id}
          getRowLabel={(a) => a.control_id}
          rowActions={rowActions}
          selected={selectable ? selected : undefined}
          onSelectionChange={selectable ? setSelected : undefined}
          total={page.data?.total ?? 0}
          sort={sort}
          onSortChange={(next) => update({ sort: next, page: 1 })}
          page={state.page}
          onPageChange={(next) =>
            // Replaced, not pushed: the table also moves a stale page back in range, and a
            // pushed correction would bring Back to the bad page again.
            update({ page: next }, { replace: true })
          }
          loading={page.isFetching && !page.data}
          empty={empty}
        />
      )}
    </div>
  );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4">
      <h1 className="text-center ramp-page-title text-primary lg:text-left">
        <Trans
          i18nKey={`animals.title.${state.kind}`}
          components={{ b: <strong className="font-bold" /> }}
        />
      </h1>
      <Tabs
        label={t('animals.kindsLabel')}
        type="solid"
        size={desktop ? 'md' : 'sm'}
        value={state.kind}
        onChange={(value) => update({ kind: value as ListKind })}
        items={KINDS.map((kind) => ({
          value: kind,
          icon: KIND_ICONS[kind],
          label: kindLabels[kind],
          content: kind === state.kind ? body : null,
        }))}
      />
      <RemoveAnimalsDialog
        animals={toRemove}
        noun={kindNoun}
        loading={remove.isPending}
        onCancel={() => setToRemove(null)}
        onConfirm={confirmRemove}
        returnFocus={removeFrom}
      />
      <MoveToGroupDialog
        animalIds={toMove}
        onClose={() => setToMove(null)}
        onMoved={() => setSelected([])}
        returnFocus={removeFrom}
      />
    </div>
  );
}
